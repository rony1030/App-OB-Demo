-- This helper is called by other security-definer workflows. It is not a
-- client-facing RPC and must not be directly callable from the API.
revoke all on function public.notify_org_admins(bigint, text, text, text, text)
  from public, anon, authenticated;

grant execute on function public.notify_org_admins(bigint, text, text, text, text)
  to service_role;
