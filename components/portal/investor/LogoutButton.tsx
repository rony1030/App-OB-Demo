'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logoutInvestorAction } from '@/app/(public)/inversionista/actions';

export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutInvestorAction();
      router.push('/inversionista');
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      title="Cerrar sesión segura"
      aria-label="Cerrar sesión segura"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE3EE] px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Cerrar sesión</span>
    </button>
  );
}
