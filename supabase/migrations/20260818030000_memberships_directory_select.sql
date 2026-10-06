-- Same "open internal directory" posture already adopted this session for
-- `organizations` (20260818020000) and `profiles` (20260818010000): a master
-- broker issuing a collaboration agreement needs to pick a signer from
-- ANOTHER organization's roster, which the existing
-- memberships_self_or_admin_select policy correctly blocks (you can only see
-- memberships of orgs you administer). Without this, the "Emitir acuerdo"
-- signer picker can never be populated for a brand-new relationship.
create policy memberships_directory_select on public.memberships
  for select to authenticated
  using (status = 'active');
