
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { ShieldAlert } from "lucide-react";
import { getInvitationByToken } from "@/app/portal/admin/users/user-actions";
import AcceptInvitationCard from "@/components/portal/auth/AcceptInvitationCard";

export default async function PublicInvitePage(props: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
}) {
  const [{ token }, query] = await Promise.all([props.params, props.searchParams]);
  const initialAdminName = typeof query.name === 'string' ? query.name.slice(0, 160) : '';
  const { invitation, error } = await getInvitationByToken(token);

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div className="max-w-sm space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/70">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-black"><LocalizedText text={"Invitación no disponible"} /></h1>
          <p className="text-xs text-white/60">
            {error || "El enlace no es válido o ha expirado. Solicita una nueva invitación a tu administrador."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <AcceptInvitationCard
        token={token}
        email={invitation.email}
        role={invitation.role}
        organizationName={invitation.organizationName}
        expiresAt={invitation.expiresAt}
        initialAdminName={initialAdminName}
      />
    </main>
  );
}
