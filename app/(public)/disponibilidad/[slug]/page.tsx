import { notFound } from 'next/navigation';
import { getPublicProject } from '@/lib/data/projects';
import { availabilityReport } from '@/lib/availability/report';
import AvailabilityReportView from '@/components/availability/AvailabilityReportView';

export const dynamic = 'force-dynamic';
export const metadata = { title:'Disponibilidad · Osvaldo Bello', robots:{index:false,follow:false} };

export default async function AvailabilityPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const project=await getPublicProject(slug);
  if (!project) notFound();
  return <AvailabilityReportView report={availabilityReport(project)}/>;
}
