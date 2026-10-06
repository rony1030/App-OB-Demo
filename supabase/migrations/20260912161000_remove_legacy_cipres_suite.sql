-- Cipres Residences is offered only with Villa Esmeralda, Villa Perla and
-- Villa Ámbar. Remove the legacy import that created a non-existent suite.
delete from public.typologies t
using public.projects p
where t.project_id = p.id
  and p.slug = 'cipres-residences'
  and lower(trim(t.name)) in ('suite estándar', 'suite estandar');
