-- Per-IP request log for the public-submit endpoint. Only hashed IPs are stored.
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.rate_limits TO service_role;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: visitors and signed-in users can never read or write this table.

CREATE INDEX rate_limits_bucket_ip_created_idx ON public.rate_limits (bucket, ip_hash, created_at DESC);
CREATE INDEX rate_limits_created_idx ON public.rate_limits (created_at);

COMMENT ON TABLE public.rate_limits IS 'public-submit request log keyed by keyed-hash of the client IP; written only via consume_rate_limit.';

-- Atomically records one request if the (bucket, ip_hash) pair is under its limit
-- within the rolling window. Returns true when allowed, false when limited.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(_bucket text, _ip_hash text, _limit integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  IF _bucket IS NULL OR length(_bucket) NOT BETWEEN 1 AND 64
     OR _ip_hash IS NULL OR _ip_hash !~ '^[0-9a-f]{64}$'
     OR _limit IS NULL OR _limit < 1 OR _limit > 1000
     OR _window_seconds IS NULL OR _window_seconds < 1 OR _window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid rate limit arguments';
  END IF;

  -- Serialise concurrent requests for the same key so the count cannot be raced.
  PERFORM pg_advisory_xact_lock(hashtextextended('rate_limit:' || _bucket || ':' || _ip_hash, 0));

  DELETE FROM public.rate_limits
   WHERE bucket = _bucket AND ip_hash = _ip_hash
     AND created_at < now() - make_interval(secs => _window_seconds);

  -- Occasionally prune stale rows from every key.
  IF random() < 0.02 THEN
    DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 day';
  END IF;

  SELECT count(*) INTO _count FROM public.rate_limits
   WHERE bucket = _bucket AND ip_hash = _ip_hash
     AND created_at >= now() - make_interval(secs => _window_seconds);

  IF _count >= _limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (bucket, ip_hash) VALUES (_bucket, _ip_hash);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) TO service_role;