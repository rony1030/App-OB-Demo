import { getPublicProject } from '@/lib/data/projects';
import { availabilityReport,availabilityPath } from '@/lib/availability/report';
import { buildAvailabilityPdf } from '@/lib/export/availability-pdf';

export const dynamic = 'force-dynamic';

export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const project=await getPublicProject(slug);
  if (!project) return new Response('Proyecto no disponible.',{status:404});
  const report=availabilityReport(project), search=new URL(request.url).searchParams;
  const locale=search.get('lang')==='en'?'en':search.get('lang')==='fr'?'fr':'es';
  const status=search.get('status') ?? 'Disponible', q=(search.get('q') || '').trim().toLowerCase().slice(0,200), delivery=search.get('delivery') || '';
  const units=report.units.filter(u=>(!status || status===u.status) && (!delivery || u.customColumns?.['Plazo de entrega']===delivery) &&
    (!q || [u.unit,u.type,u.tower,...Object.values(u.customColumns || {})].join(' ').toLowerCase().includes(q)));
  const origin=process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://brokers.osvaldobello.com';
  const bytes=await buildAvailabilityPdf({projectName:report.projectName,projectSlug:report.projectSlug,units,customColumns:report.customColumns,updatedAt:report.updatedAt,availabilityUrl:new URL(availabilityPath(slug),origin).href,locale});
  return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Disponibilidad_${slug.replace(/[^a-z0-9-]/gi,'_')}.pdf"`,'Cache-Control':'no-store'}});
}
