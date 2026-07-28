
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- sanctions_entities
CREATE TABLE public.sanctions_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('OFAC','UN','EU','NFIU')),
  entity_name text NOT NULL,
  aliases jsonb,
  date_of_birth text,
  nationality text,
  entity_type text,
  reason text,
  list_date date,
  last_updated timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  raw_data jsonb,
  source_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sanctions_entities_source_ref_uidx
  ON public.sanctions_entities (source, source_ref)
  WHERE source_ref IS NOT NULL;

CREATE INDEX sanctions_name_trgm
  ON public.sanctions_entities USING gin (entity_name gin_trgm_ops);

CREATE INDEX sanctions_entities_source_idx
  ON public.sanctions_entities (source) WHERE is_active = true;

GRANT SELECT ON public.sanctions_entities TO authenticated;
GRANT ALL ON public.sanctions_entities TO service_role;

ALTER TABLE public.sanctions_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read sanctions"
  ON public.sanctions_entities FOR SELECT TO authenticated USING (true);

-- sanctions_meta
CREATE TABLE public.sanctions_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_name text NOT NULL UNIQUE CHECK (list_name IN ('OFAC','UN','EU','NFIU')),
  last_refreshed_at timestamptz,
  record_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('success','failed','pending')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sanctions_meta TO authenticated;
GRANT ALL ON public.sanctions_meta TO service_role;

ALTER TABLE public.sanctions_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read sanctions meta"
  ON public.sanctions_meta FOR SELECT TO authenticated USING (true);

INSERT INTO public.sanctions_meta (list_name, status) VALUES
  ('OFAC','pending'),('UN','pending'),('EU','pending'),('NFIU','pending');

-- updated_at triggers
CREATE TRIGGER sanctions_entities_updated_at
  BEFORE UPDATE ON public.sanctions_entities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sanctions_meta_updated_at
  BEFORE UPDATE ON public.sanctions_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fuzzy screening RPC
CREATE OR REPLACE FUNCTION public.screen_entity(search_name text, threshold real DEFAULT 0.7)
RETURNS TABLE (
  id uuid,
  entity_name text,
  source text,
  entity_type text,
  reason text,
  list_date date,
  aliases jsonb,
  nationality text,
  score real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    s.id,
    s.entity_name,
    s.source,
    s.entity_type,
    s.reason,
    s.list_date,
    s.aliases,
    s.nationality,
    similarity(s.entity_name, search_name) AS score
  FROM public.sanctions_entities s
  WHERE s.is_active = true
    AND similarity(s.entity_name, search_name) > threshold
  ORDER BY score DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.screen_entity(text, real) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.screen_entity(text, real) TO authenticated, service_role;
