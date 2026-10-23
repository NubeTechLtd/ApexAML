ALTER TABLE public.audit_log ALTER COLUMN chain_index SET DEFAULT 0, ALTER COLUMN prev_hash SET DEFAULT '', ALTER COLUMN row_hash SET DEFAULT '';
COMMENT ON COLUMN public.audit_log.chain_index IS 'Assigned under per-institution advisory lock by BEFORE INSERT trigger; supplied/default values are always overwritten.';
COMMENT ON COLUMN public.audit_log.prev_hash IS 'Computed by BEFORE INSERT trigger; supplied/default values are always overwritten.';
COMMENT ON COLUMN public.audit_log.row_hash IS 'SHA-256 computed by BEFORE INSERT trigger; supplied/default values are always overwritten.';