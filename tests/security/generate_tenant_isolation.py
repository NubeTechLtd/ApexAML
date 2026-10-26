"""Generate rollback-only live SQL. Run through the managed database write tool.
Requires two temporary Auth user UUIDs. Never changes policies or audit triggers.
Every attempt uses real PostgreSQL roles + JWT claims, not mocked policy text.
"""
import json, sys, uuid
from pathlib import Path

def lit(x):
    return "'" + str(x).replace("'", "''") + "'"
def insert(table, data):
    vals = [lit(v) if not isinstance(v, (int, float)) else str(v) for v in data.values()]
    return f'INSERT INTO public.{table} ({",".join(data)}) VALUES ({",".join(vals)})'
def generate(user_a, user_b):
    users = [user_a,user_b]
    institutions = [str(uuid.uuid4()),str(uuid.uuid4())]
    fixtures=[]
    setup=[]
    for i in range(2):
        inst=institutions[i]; user=users[i]
        customer,alert,draft=[str(uuid.uuid4()) for _ in range(3)]
        nuban=('91' if i==0 else '92')+str(uuid.uuid4().int)[0:8]
        rows={
          'institutions':dict(id=inst,name='Isolation test '+('A' if i==0 else 'B'),institution_type='microfinance'),
          'user_institutions':dict(user_id=user,institution_id=inst,role='institution_admin'),
          'customers':dict(id=customer,institution_id=inst,full_name='Isolation test customer',nuban=nuban),
          'transactions':dict(id=str(uuid.uuid4()),institution_id=inst,customer_id=customer,tx_type='credit',channel='transfer',amount_ngn=100,occurred_at='2026-10-26T08:00:00Z'),
          'alerts':dict(id=alert,institution_id=inst,customer_id=customer,case_id='ISOLATION-'+str(uuid.uuid4()),rule_triggered='test',alert_type='test',risk_level='Low'),
          'str_drafts':dict(id=draft,alert_id=alert,narrative='Temporary authorization fixture'),
          'str_exports':dict(id=str(uuid.uuid4()),alert_id=alert,str_draft_id=draft,filename='test.xml',goaml_xml='<test/>'),
          'kyc_documents':dict(id=str(uuid.uuid4()),institution_id=inst,customer_id=customer,document_type='national_id',document_name='test.txt',storage_path=inst+'/'+customer+'/test.txt',uploaded_by='isolation-test'),
          'adverse_media_results':dict(id=str(uuid.uuid4()),institution_id=inst,customer_id=customer,customer_name='Isolation test'),
          'ctr_queue':dict(id=str(uuid.uuid4()),institution_id=inst,customer_id=customer,report_date='2026-10-26',total_cash_ngn=100),
          'transaction_queue':dict(id=str(uuid.uuid4()),institution_id=inst,transaction_id=str(uuid.uuid4()),account_number=nuban,amount=100,currency='NGN',channel='transfer',transaction_datetime='2026-10-26T08:00:00Z',direction='credit'),
          'customer_risk_scores':dict(id=str(uuid.uuid4()),institution_id=inst,customer_id=customer),
          'risk_score_history':dict(id=str(uuid.uuid4()),institution_id=inst,customer_id=customer,new_score=10,trigger_type='test'),
          'institution_webhook_secrets':dict(id=str(uuid.uuid4()),institution_id=inst,key_id='test-'+str(uuid.uuid4()),encrypted_secret='nonfunctional-test-ciphertext'),
          'processed_webhook_events':dict(id=str(uuid.uuid4()),institution_id=inst,key_id='test-key',event_id=str(uuid.uuid4())),
          'webhook_rejections':dict(id=str(uuid.uuid4()),institution_id=inst,reason='Temporary fixture'),
          'support_access_grants':dict(id=str(uuid.uuid4()),institution_id=inst,user_id=user,justification='Temporary isolation test fixture',expires_at='2020-01-01T00:00:00Z'),
          'audit_log':dict(id=str(uuid.uuid4()),institution_id=inst,user_id=user,action='ISOLATION_TEST',resource=customer,justification='Temporary rollback-only fixture'),
        }
        fixtures.append(rows)
        setup.extend(insert(t,d)+';' for t,d in rows.items())
    # Concrete insert payloads avoid foreign-key/NOT NULL errors masquerading as denials.
    cases=[]
    own_permissions={t:('SELECT','INSERT','UPDATE') for t in fixtures[0]}
    for t in ('institutions','user_institutions','str_exports','processed_webhook_events','webhook_rejections','support_access_grants'):
        own_permissions[t]=('SELECT',) if t!='str_exports' else ('SELECT','INSERT')
    own_permissions['institution_webhook_secrets']=()
    own_permissions['audit_log']=('SELECT','INSERT')
    for table in fixtures[0]:
      for scenario,actor,target in [('A_to_B',0,1),('B_to_A',1,0),('anon_to_A',None,0),('anon_to_B',None,1),('A_own',0,0),('B_own',1,1)]:
        row=fixtures[target][table]
        predicate=' AND '.join(k+'='+lit(row[k])+'::uuid' for k in (['user_id','institution_id'] if table=='user_institutions' else ['id']))
        for op in ('SELECT','INSERT','UPDATE','DELETE'):
          payload=dict(row)
          if 'id' in payload: payload['id']=str(uuid.uuid4())
          for k in ('case_id','transaction_id','key_id','event_id'): 
            if k in payload: payload[k]='test-'+str(uuid.uuid4())
          if table=='institutions': payload['name']='Temporary insert control'
          if table=='customers': payload['nuban']=str(uuid.uuid4().int)[:10]
          if table in ('ctr_queue','customer_risk_scores'): payload['customer_id']='test-'+str(uuid.uuid4())
          if table=='ctr_queue': payload['report_date']='2026-10-27'
          if table=='user_institutions': payload['user_id']=users[1-target]
          if table=='audit_log' and actor is not None: payload['user_id']=users[actor]
          mutable={'institutions':'name','user_institutions':'role','customers':'full_name','transactions':'amount_ngn','alerts':'description','str_drafts':'narrative','str_exports':'filename','kyc_documents':'document_name','adverse_media_results':'customer_name','ctr_queue':'total_cash_ngn','transaction_queue':'amount','customer_risk_scores':'risk_score','risk_score_history':'new_score','institution_webhook_secrets':'encrypted_secret','processed_webhook_events':'event_id','webhook_rejections':'reason','support_access_grants':'justification','audit_log':'justification'}[table]
          value='101' if mutable in ('amount_ngn','amount','total_cash_ngn','risk_score','new_score') else lit('institution_admin' if mutable=='role' else 'isolation mutation')
          sql={'SELECT':f'SELECT count(*) FROM public.{table} WHERE {predicate}', 'INSERT':insert(table,payload),'UPDATE':f'UPDATE public.{table} SET {mutable}={value} WHERE {predicate}','DELETE':f'DELETE FROM public.{table} WHERE {predicate}'}[op]
          allowed=scenario.endswith('_own') and op in own_permissions[table]
          # Membership insert controls intentionally denied even to own admins.
          cases.append((table,scenario,op,actor,allowed,sql))
    audit=fixtures[0]['audit_log']['id']
    for role in ('anon','authenticated_no_membership','analyst','compliance_officer','institution_admin','platform_admin','service_role','postgres'):
      for op in ('UPDATE','DELETE','TRUNCATE'):
        sql={'UPDATE':f"UPDATE public.audit_log SET justification='tampered' WHERE id='{audit}'",'DELETE':f"DELETE FROM public.audit_log WHERE id='{audit}'",'TRUNCATE':'TRUNCATE public.audit_log, public.platform_role_changes, public.platform_role_notifications'}[op]
        cases.append(('audit_log','role_'+role,op,0,False,sql))
    out=['DO $suite$ DECLARE results jsonb:=\'[]\'::jsonb; n bigint; code text; message text; ok boolean; BEGIN']+setup
    for table,scenario,op,actor,allowed,sql in cases:
      role='anon' if actor is None else 'authenticated'
      pre=''
      if scenario.startswith('role_'):
        r=scenario[5:]
        if r in ('anon','service_role','postgres'): role=r
        if r in ('analyst','compliance_officer','institution_admin'): pre=f"UPDATE public.user_institutions SET role='{r}' WHERE user_id='{user_a}';"
        if r in ('platform_admin','authenticated_no_membership'): pre=f"DELETE FROM public.user_institutions WHERE user_id='{user_a}';"
        if r=='platform_admin': pre+=f"INSERT INTO public.user_roles(user_id,role) VALUES('{user_a}','platform_admin');"
      claims={} if actor is None else dict(sub=users[actor],role=role,email='isolation@example.invalid',aal='aal2')
      expected='true' if allowed else 'false'
      perform=f'EXECUTE {lit(sql)} INTO n;' if op=='SELECT' else f'EXECUTE {lit(sql)}; GET DIAGNOSTICS n=ROW_COUNT;'
      out.append(f'''BEGIN
        {pre}
        PERFORM set_config('request.jwt.claims',{lit(json.dumps(claims))},true);
        PERFORM set_config('request.jwt.claim.sub',{lit(claims.get('sub',''))},true);
        PERFORM set_config('request.jwt.claim.role',{lit(role)},true);
        EXECUTE 'SET LOCAL ROLE {role}';
        n:=0; code:='00000'; message:='';
        BEGIN
          {perform}
          RAISE EXCEPTION USING ERRCODE='PT001', MESSAGE='rollback attempt';
        EXCEPTION WHEN SQLSTATE 'PT001' THEN NULL;
          WHEN OTHERS THEN GET STACKED DIAGNOSTICS code=RETURNED_SQLSTATE,message=MESSAGE_TEXT; n:=0;
        END;
        EXECUTE 'RESET ROLE';
        ok:=CASE WHEN {expected} THEN code='00000' AND n>0 ELSE (code='00000' AND n=0) OR code='42501' OR (code='P0001' AND message LIKE 'Audit log is append-only%') END;
        results:=results||jsonb_build_array(jsonb_build_array({lit(table)},{lit(scenario)},{lit(op)},CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END,n,code));
        RAISE EXCEPTION USING ERRCODE='PT002', MESSAGE='rollback actor changes';
      EXCEPTION WHEN SQLSTATE 'PT002' THEN NULL; END;''')
    # Exception aborts ALL fixtures and audit entries; diagnostics retain local results.
    out.append("RAISE EXCEPTION USING MESSAGE='ISOLATION_RESULTS:'||results::text; END $suite$;")
    return '\n'.join(out)
if __name__=='__main__':
    if len(sys.argv)!=4: raise SystemExit('Usage: generate_tenant_isolation.py USER_A USER_B OUTPUT_SQL')
    Path(sys.argv[3]).write_text(generate(sys.argv[1],sys.argv[2]))
    print('Generated rollback-only suite')
