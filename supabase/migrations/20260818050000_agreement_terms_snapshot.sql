-- Commission, payment terms, and the Master Broker's signing representative
-- are NOT fixed per organization — the user clarified the platform is
-- shared across allied master brokers, and even the same master broker can
-- have different responsible reps, commissions, or payment schedules per
-- developer/project. These are captured per-agreement (like any real
-- contract's own terms) rather than defaulted from the organization profile.
alter table public.agreements
  add column if not exists commission_rate numeric(5,2) check (commission_rate is null or commission_rate between 0 and 100),
  add column if not exists commission_terms text,
  add column if not exists master_broker_rep_name text,
  add column if not exists master_broker_rep_position text,
  add column if not exists master_broker_rep_id text,
  add column if not exists master_broker_rep_email text;
