BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE s uuid; e uuid; result jsonb; n integer; allowed integer:=0;
BEGIN
 INSERT INTO public.demo_sessions(email) VALUES('demo-quota-test@example.com') RETURNING id INTO s;
 FOR n IN 1..10 LOOP
  result := public.reserve_demo_notification(s,gen_random_uuid(),'alert_assigned');
  IF NOT (result->>'allowed')::boolean THEN RAISE EXCEPTION 'FAILED 10/session control %',result; END IF;
 END LOOP;
 result := public.reserve_demo_notification(s,gen_random_uuid(),'alert_assigned');
 IF result->>'reason'<>'session_limit' THEN RAISE EXCEPTION 'FAILED session limit %',result; END IF;
 RAISE NOTICE 'PASS: 10 allowed per session, 11th rejected';
 FOR n IN 1..2 LOOP
  INSERT INTO public.demo_sessions(email) VALUES('DEMO-QUOTA-TEST@example.com') RETURNING id INTO s;
  FOR allowed IN 1..10 LOOP
   result := public.reserve_demo_notification(s,gen_random_uuid(),'ctr_filed');
   IF NOT (result->>'allowed')::boolean THEN RAISE EXCEPTION 'FAILED 30/address control %',result; END IF;
  END LOOP;
 END LOOP;
 INSERT INTO public.demo_sessions(email) VALUES('Demo-Quota-Test@example.com') RETURNING id INTO s;
 result := public.reserve_demo_notification(s,gen_random_uuid(),'ctr_filed');
 IF result->>'reason'<>'daily_address_limit' THEN RAISE EXCEPTION 'FAILED address limit %',result; END IF;
 RAISE NOTICE 'PASS: 30 allowed per normalized address/day, 31st rejected';
 INSERT INTO public.demo_sessions(email) VALUES('demo-dedupe-test@example.com') RETURNING id INTO s;
 e := gen_random_uuid();
 result := public.reserve_demo_notification(s,e,'str_exported');
 result := public.reserve_demo_notification(s,e,'str_exported');
 IF result->>'reason'<>'duplicate' THEN RAISE EXCEPTION 'FAILED dedupe %',result; END IF;
 SELECT count(*) INTO n FROM public.demo_notification_events WHERE session_id=s;
 IF n<>1 THEN RAISE EXCEPTION 'FAILED duplicate consumes quota'; END IF;
 RAISE NOTICE 'PASS: duplicate event reserved only once';
 result := public.reserve_demo_notification(s,gen_random_uuid(),'daily_briefing');
 result := public.reserve_demo_notification(s,gen_random_uuid(),'daily_briefing');
 IF result->>'reason'<>'briefing_already_sent' THEN RAISE EXCEPTION 'FAILED daily briefing %',result; END IF;
 RAISE NOTICE 'PASS: briefing once per UTC day';
END $$;
ROLLBACK;
