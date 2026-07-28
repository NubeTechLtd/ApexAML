
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
SECURITY INVOKER
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

-- Storage RLS: authenticated can upload/read NFIU files; service_role manages
CREATE POLICY "Authenticated upload nfiu list"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nfiu-list-uploads');

CREATE POLICY "Authenticated read nfiu list"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'nfiu-list-uploads');
