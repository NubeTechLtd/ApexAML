ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS amount_ngn numeric;
COMMENT ON COLUMN public.alerts.amount_ngn IS 'Flagged amount in NGN supplied with the case (for example from a CSV import); null when not supplied.';

CREATE OR REPLACE FUNCTION public.import_alerts_csv(_institution_id uuid, _rows jsonb, _file_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  r jsonb;
  n integer;
  i integer := 0;
  v_case text; v_name text; v_bvn text; v_rule text; v_risk text; v_desc text; v_amount_text text; v_amount numeric;
  v_customer uuid;
  created_customers integer := 0;
  fname text := left(btrim(coalesce(_file_name, '')), 200);
  dup text;
BEGIN
  IF auth.uid() IS NULL OR NOT private.tenant_role(_institution_id, ARRAY['analyst','compliance_officer','institution_admin']) THEN
    RAISE EXCEPTION 'Only analysts, compliance officers and administrators of this institution can import cases' USING ERRCODE = '42501';
  END IF;
  IF _rows IS NULL OR jsonb_typeof(_rows) <> 'array' THEN
    RAISE EXCEPTION 'No rows to import' USING ERRCODE = '22023';
  END IF;
  n := jsonb_array_length(_rows);
  IF n < 1 OR n > 500 THEN
    RAISE EXCEPTION 'A file can contain 1 to 500 cases' USING ERRCODE = '22023';
  END IF;

  SELECT x INTO dup FROM (
    SELECT btrim(e->>'case_id') AS x FROM jsonb_array_elements(_rows) e
  ) s GROUP BY x HAVING count(*) > 1 LIMIT 1;
  IF dup IS NOT NULL THEN
    RAISE EXCEPTION 'Case ID % appears more than once in the file', dup USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('alerts-csv-import:' || _institution_id::text, 0));

  FOR r IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    i := i + 1;
    IF jsonb_typeof(r) <> 'object' THEN
      RAISE EXCEPTION 'Row %: not a valid row', i USING ERRCODE = '22023';
    END IF;
    v_case := btrim(coalesce(r->>'case_id', ''));
    v_name := btrim(coalesce(r->>'customer_name', ''));
    v_bvn := nullif(btrim(coalesce(r->>'bvn', '')), '');
    v_rule := btrim(coalesce(r->>'rule_triggered', ''));
    v_risk := btrim(coalesce(r->>'risk_level', ''));
    v_desc := nullif(btrim(coalesce(r->>'description', '')), '');
    v_amount_text := nullif(btrim(coalesce(r->>'amount_ngn', '')), '');

    IF v_case !~ '^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$' THEN
      RAISE EXCEPTION 'Row %: case_id must be 1 to 64 letters, numbers, dots, dashes, underscores or slashes', i USING ERRCODE = '22023';
    END IF;
    IF length(v_name) < 1 OR length(v_name) > 200 THEN
      RAISE EXCEPTION 'Row %: customer_name is required (up to 200 characters)', i USING ERRCODE = '22023';
    END IF;
    IF v_bvn IS NOT NULL AND v_bvn !~ '^[0-9]{11}$' THEN
      RAISE EXCEPTION 'Row %: bvn must be 11 digits', i USING ERRCODE = '22023';
    END IF;
    IF length(v_rule) < 1 OR length(v_rule) > 200 THEN
      RAISE EXCEPTION 'Row %: rule_triggered is required (up to 200 characters)', i USING ERRCODE = '22023';
    END IF;
    IF v_risk NOT IN ('Critical','High','Medium','Low') THEN
      RAISE EXCEPTION 'Row %: risk_level must be Critical, High, Medium or Low', i USING ERRCODE = '22023';
    END IF;
    IF v_desc IS NOT NULL AND length(v_desc) > 2000 THEN
      RAISE EXCEPTION 'Row %: description is longer than 2000 characters', i USING ERRCODE = '22023';
    END IF;
    IF v_amount_text IS NULL THEN
      v_amount := NULL;
    ELSIF v_amount_text ~ '^[0-9]{1,15}(\.[0-9]{1,2})?$' THEN
      v_amount := v_amount_text::numeric;
    ELSE
      RAISE EXCEPTION 'Row %: amount_ngn must be a positive number with up to 2 decimals', i USING ERRCODE = '22023';
    END IF;

    IF EXISTS (SELECT 1 FROM public.alerts WHERE case_id = v_case) THEN
      RAISE EXCEPTION 'Row %: case ID % is already in use', i, v_case USING ERRCODE = '23505';
    END IF;

    v_customer := NULL;
    IF v_bvn IS NOT NULL THEN
      SELECT id INTO v_customer FROM public.customers
       WHERE institution_id = _institution_id AND bvn = v_bvn
       ORDER BY created_at ASC LIMIT 1;
    END IF;
    IF v_customer IS NULL THEN
      INSERT INTO public.customers(institution_id, full_name, bvn)
      VALUES (_institution_id, v_name, v_bvn)
      RETURNING id INTO v_customer;
      created_customers := created_customers + 1;
    END IF;

    INSERT INTO public.alerts(institution_id, case_id, customer_id, rule_triggered, alert_type, risk_level, status, description, amount_ngn)
    VALUES (_institution_id, v_case, v_customer, v_rule, 'STANDARD', v_risk, 'Open', v_desc, v_amount);
  END LOOP;

  INSERT INTO public.audit_log(user_id, user_name, institution_id, action, resource, justification, metadata)
  VALUES (auth.uid(), coalesce(auth.jwt()->>'email', 'Unknown'), _institution_id, 'ALERTS_CSV_IMPORT', _institution_id::text,
          'Imported ' || n || ' case(s) from CSV' || CASE WHEN fname <> '' THEN ' (' || fname || ')' ELSE '' END,
          jsonb_build_object('row_count', n, 'analyst_user_id', auth.uid(), 'customers_created', created_customers, 'file_name', nullif(fname, '')));

  RETURN jsonb_build_object('imported', n, 'customers_created', created_customers);
END
$function$;

REVOKE ALL ON FUNCTION public.import_alerts_csv(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_alerts_csv(uuid, jsonb, text) TO authenticated;