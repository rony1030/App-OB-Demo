-- public_code already has a unique constraint-backed index. Keeping a second
-- identical unique index adds write overhead without improving lookups.
drop index if exists public.contacts_public_code_idx;
