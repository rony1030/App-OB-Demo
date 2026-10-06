import { redirect } from 'next/navigation';

export default async function ProjectEditPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  redirect(`/portal/admin/projects?slug=${params.slug}&tab=edit`);
}
