-- External inventory synchronization must not make an actively reserved unit
-- available again. The expiry job releases it only after ending the reservation.
create or replace function private.preserve_active_reservation_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status in ('reserved', 'blocked')
     and new.status <> old.status
     and exists (select 1 from public.reservations r where r.unit_id = old.id and r.status = 'active') then
    new.status := old.status;
    new.reservation_expires_at := old.reservation_expires_at;
  end if;
  return new;
end;
$$;

drop trigger if exists units_preserve_active_reservation_status on public.units;
create trigger units_preserve_active_reservation_status
before update of status on public.units
for each row execute function private.preserve_active_reservation_status();
