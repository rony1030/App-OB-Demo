-- The public web route validates requests and invokes this RPC with the
-- server-only service role. Browsers must not execute it directly.
revoke execute on function public.submit_proposal_decision(text, text, text, text)
from public, anon, authenticated;

grant execute on function public.submit_proposal_decision(text, text, text, text)
to service_role;
