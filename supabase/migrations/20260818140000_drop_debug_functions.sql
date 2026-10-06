-- Remove throwaway debug functions created while diagnosing the
-- engagement_events RLS false-positive (see migration 130000's comment).
drop function if exists public.debug_engagement_check(bigint, bigint);
drop function if exists public.debug_pv_check(bigint);
