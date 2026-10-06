'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function logoutDemoAction() {
  const cookieStore = await cookies();
  cookieStore.delete('demo_auth_session');
  revalidatePath('/', 'layout');
  redirect('/login');
}
