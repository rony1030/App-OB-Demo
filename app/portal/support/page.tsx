import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import SupportCenter from '@/components/portal/support/SupportCenter';
export default async function SupportPage(){const supabase=await createClient();const user=await getCurrentUser(supabase);if(!user)redirect('/login?next=/portal/support');const {data}=await (supabase).from('support_tickets').select('id,subject,category,priority,status,created_at').order('created_at',{ascending:false}).limit(100);return <SupportCenter tickets={data||[]}/>}
