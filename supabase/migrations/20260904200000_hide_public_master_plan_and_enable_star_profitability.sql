-- 1. Cana Rock Star: ensure landing_config has visibility.profitability = true and profitability configured
update public.project_media media
set alt_text = jsonb_set(
  jsonb_set(
    coalesce(nullif(media.alt_text, ''), '{}')::jsonb,
    '{visibility,profitability}',
    'true'::jsonb,
    true
  ),
  '{profitability}',
  jsonb_build_object(
    'enabled', true,
    'title', 'Rentabilidad estimada del proyecto',
    'introduction', 'Proyecciones oficiales de ocupación y tarifas de mercado para las tipologías de Cana Rock Star, bajo un escenario de ocupación estimada del 70% (255 noches por año).',
    'source', 'Proyección comercial de Cana Rock Star basada en ocupación y tarifas de mercado.',
    'disclaimer', 'Las tarifas promedio pueden variar según operador, acuerdos de servicio y condiciones del mercado. Esta información no constituye una garantía de rentabilidad.',
    'items', jsonb_build_array(
      jsonb_build_object('label', '1 habitación', 'roi', '10.02% ROI', 'description', 'Con un precio promedio de US$ 180,000 y una tarifa promedio de US$ 120, genera un ingreso anual bruto de US$ 30,600. Tras costos operativos, se obtiene un ingreso neto anual estimado de US$ 18,030.'),
      jsonb_build_object('label', '2 habitaciones', 'roi', '8.65% ROI', 'description', 'Con un precio promedio de US$ 285,000 y una tarifa promedio de US$ 170, genera un ingreso anual bruto de US$ 43,350. Tras costos operativos, el ingreso neto anual estimado es de US$ 24,665.'),
      jsonb_build_object('label', '3 habitaciones', 'roi', '7.69% ROI', 'description', 'Con un precio promedio de US$ 390,000 y una tarifa promedio de US$ 210, genera un ingreso anual bruto de US$ 53,550. Tras costos operativos, se alcanza un ingreso neto anual estimado de US$ 29,999.')
    )
  ),
  true
)::text
from public.projects project
where media.project_id = project.id
  and media.kind = 'landing_config'
  and project.slug = 'cana-rock-star';

-- 2. Update Master Plan document visibility to authorized so it never appears on the public landing page
update public.project_documents
set visibility = 'authorized',
    updated_at = now()
where title ilike '%master plan%'
  and visibility = 'public';
