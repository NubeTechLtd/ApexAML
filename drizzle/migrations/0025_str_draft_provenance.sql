ALTER TABLE public.str_drafts
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS input_hash text,
  ADD COLUMN IF NOT EXISTS author_name text;

COMMENT ON COLUMN public.str_drafts.generated_by IS 'ai = narrative produced by the AI model; analyst_edit = text written or edited by an analyst.';
COMMENT ON COLUMN public.str_drafts.provider IS 'AI model vendor for ai rows (e.g. google, openai); null for analyst_edit.';
COMMENT ON COLUMN public.str_drafts.model IS 'Model identifier reported by the AI gateway for ai rows; null for analyst_edit.';
COMMENT ON COLUMN public.str_drafts.prompt_version IS 'Identifier of the system prompt used (name + SHA-256 prefix of its text).';
COMMENT ON COLUMN public.str_drafts.input_hash IS 'SHA-256 hex of the exact system prompt and input sent to the model.';
COMMENT ON COLUMN public.str_drafts.author_name IS 'Display name of created_by, stamped server-side on insert.';

-- Backfill: the two legacy rows were written by generate-str-narrative while it called google/gemini-3.8-flash.
UPDATE public.str_drafts
   SET generated_by = 'ai',
       provider = COALESCE(provider, 'google'),
       model = COALESCE(model, 'google/gemini-3.8-flash')
 WHERE generated_by = 'claude_api';
UPDATE public.str_drafts SET generated_by = 'analyst_edit' WHERE generated_by NOT IN ('ai', 'analyst_edit');
UPDATE public.str_drafts d
   SET author_name = COALESCE(NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''), u.email)
  FROM auth.users u
 WHERE u.id = d.created_by AND d.author_name IS NULL;

ALTER TABLE public.str_drafts ALTER COLUMN generated_by SET DEFAULT 'analyst_edit';
ALTER TABLE public.str_drafts ADD CONSTRAINT str_drafts_generated_by_check
  CHECK (generated_by IN ('ai', 'analyst_edit'));
ALTER TABLE public.str_drafts ADD CONSTRAINT str_drafts_analyst_edit_no_ai_fields
  CHECK (generated_by <> 'analyst_edit' OR (provider IS NULL AND model IS NULL AND prompt_version IS NULL AND input_hash IS NULL));
-- New AI rows must carry full provenance; the two legacy rows predate prompt/input hashing.
ALTER TABLE public.str_drafts ADD CONSTRAINT str_drafts_ai_provenance_required
  CHECK (generated_by <> 'ai' OR (provider IS NOT NULL AND model IS NOT NULL AND prompt_version IS NOT NULL AND input_hash IS NOT NULL)) NOT VALID;

CREATE OR REPLACE FUNCTION public.str_drafts_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF uid IS NOT NULL THEN
      NEW.created_by := uid;
    END IF;
    SELECT COALESCE(NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''), u.email)
      INTO NEW.author_name
      FROM auth.users u
     WHERE u.id = NEW.created_by;
    RETURN NEW;
  END IF;

  IF NEW.generated_by IS DISTINCT FROM OLD.generated_by
     OR NEW.provider IS DISTINCT FROM OLD.provider
     OR NEW.model IS DISTINCT FROM OLD.model
     OR NEW.prompt_version IS DISTINCT FROM OLD.prompt_version
     OR NEW.input_hash IS DISTINCT FROM OLD.input_hash
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.author_name IS DISTINCT FROM OLD.author_name
     OR NEW.alert_id IS DISTINCT FROM OLD.alert_id
     OR NEW.version IS DISTINCT FROM OLD.version
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR (OLD.generated_by = 'ai' AND NEW.narrative IS DISTINCT FROM OLD.narrative) THEN
    RAISE EXCEPTION 'STR draft provenance cannot be changed; save a new version instead'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.str_drafts_guard() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER str_drafts_guard
  BEFORE INSERT OR UPDATE ON public.str_drafts
  FOR EACH ROW EXECUTE FUNCTION public.str_drafts_guard();

-- Signed-in users may only save analyst text; AI rows are written by the drafting functions.
DROP POLICY IF EXISTS tenant_insert ON public.str_drafts;
CREATE POLICY tenant_insert ON public.str_drafts
  FOR INSERT TO authenticated
  WITH CHECK (
    generated_by = 'analyst_edit'
    AND EXISTS (
      SELECT 1 FROM public.alerts a
       WHERE a.id = str_drafts.alert_id
         AND private.tenant_role(a.institution_id, ARRAY['analyst', 'compliance_officer', 'institution_admin'])
    )
  );