-- Actualizar el plan de pagos para Cana Rock Star (Proyecto Listo para Entrega)
-- Esquema 20/80 (Sin etapa durante construccion)

do $$
declare
  v_project_id bigint;
  v_plan_id bigint;
begin
  select id into v_project_id from public.projects where slug = 'cana-rock-star' limit 1;
  
  if v_project_id is not null then
    select id into v_plan_id from public.payment_plans 
    where project_id = v_project_id and is_active = true 
    order by id desc limit 1;
    
    if v_plan_id is null then
      select id into v_plan_id from public.payment_plans 
      where project_id = v_project_id 
      order by id desc limit 1;
    end if;

    if v_plan_id is not null then
      update public.payment_plans
      set name = 'Plan listo para entrega Cana Rock Star (20/80)',
          is_active = true
      where id = v_plan_id;

      delete from public.payment_plan_steps where payment_plan_id = v_plan_id;

      insert into public.payment_plan_steps (payment_plan_id, label, percentage, fixed_amount, milestone, sort_order)
      values
        (v_plan_id, 'Reserva', null, 3000, 'Al separar la unidad', 0),
        (v_plan_id, 'Inicial', 20, null, '20% a la firma del contrato (saldo luego de reserva)', 1),
        (v_plan_id, 'Contra entrega', 80, null, '80% contra entrega de la unidad', 2);
    end if;
  end if;
end $$;