import { redirect } from 'next/navigation';
import MyProfessionalProfile from '@/components/portal/MyProfessionalProfile';
import { getCurrentUser } from '@/lib/auth/get-user';

export default async function MyProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/portal/profile');
  return <MyProfessionalProfile profile={user} />;
}
