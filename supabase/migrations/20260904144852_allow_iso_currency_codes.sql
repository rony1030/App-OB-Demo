-- Currency is stored as an ISO 4217-style three-letter code. This change is
-- intentionally limited to the project and inventory surfaces that the CRM
-- edits today; it leaves historical sales, commissions and client budgets intact.
alter table public.projects drop constraint if exists projects_currency_check;
alter table public.projects add constraint projects_currency_iso_check check (currency ~ '^[A-Z]{3}$');

alter table public.payment_plans drop constraint if exists payment_plans_currency_check;
alter table public.payment_plans add constraint payment_plans_currency_iso_check check (currency ~ '^[A-Z]{3}$');

alter table public.units drop constraint if exists units_currency_check;
alter table public.units add constraint units_currency_iso_check check (currency ~ '^[A-Z]{3}$');

alter table public.lots drop constraint if exists lots_currency_check;
alter table public.lots add constraint lots_currency_iso_check check (currency ~ '^[A-Z]{3}$');
