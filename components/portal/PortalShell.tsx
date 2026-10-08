'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import BrandLogo from '@/components/branding/BrandLogo';
import NotificationBell from '@/components/portal/NotificationBell';
import {
  Activity, BarChart3, Boxes, Building2, ChevronDown, CircleDollarSign, ClipboardList, Code2, Eye,
  FileCheck2, FileSignature, FileText, FolderLock, Grid2X2, Languages, Layers3, LifeBuoy, LogOut, Menu, Search, Settings,
  ShieldCheck, SwatchBook, Tag, Terminal, UserRound, Users, Video, Webhook, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CurrentSessionUser } from '@/lib/auth/get-user';
import { hasCapability, roleLabels, type RoleCapability } from '@/lib/auth/permissions';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { TranslationKey } from '@/lib/i18n/locale';
import PwaManager from '@/components/pwa/PwaManager';
import UserSwitcher from '@/components/portal/UserSwitcher';
import OrganizationSwitcher from '@/components/portal/OrganizationSwitcher';
import MarketingOfferSpotlight from '@/components/portal/MarketingOfferSpotlight';
import type { MarketingOffer } from '@/lib/data/marketing-offers';

type NavigationItem = {
  label: TranslationKey;
  href: string;
  icon: typeof Grid2X2;
  capability?: RoleCapability;
  superAdminOnly?: boolean;
};

type WorkspaceMode = 'commercial' | 'administration' | 'platform' | 'developer' | 'master_reporting';

const workspaceMeta: Record<WorkspaceMode, { label: TranslationKey; href: string; icon: typeof Grid2X2 }> = {
  commercial: { label: 'commercialCrm', href: '/portal', icon: Users },
  administration: { label: 'masterAdministration', href: '/portal/admin', icon: ShieldCheck },
  platform: { label: 'platformPanel', href: '/portal/dev', icon: Code2 },
  developer: { label: 'developerPanel', href: '/portal/developer', icon: Building2 },
  master_reporting: { label: 'masterBrokers', href: '/portal/master-reporting', icon: BarChart3 },
};

const brokerNavigation: NavigationItem[] = [
  { label: 'home', href: '/portal', icon: Grid2X2 }, { label: 'clients', href: '/portal/clientes', icon: Users },
  { label: 'negotiations', href: '/portal/leads', icon: BarChart3 }, { label: 'projects', href: '/portal/projects', icon: Building2 },
  { label: 'inventory', href: '/portal/inventory', icon: Boxes }, { label: 'agency', href: '/portal/agency', icon: ShieldCheck, capability: 'manage_agency_documents' },
  { label: 'proposals', href: '/portal/proposals', icon: FileText, capability: 'create_proposals' }, { label: 'commissions', href: '/portal/comisiones', icon: CircleDollarSign, capability: 'manage_commission_claims' },
  { label: 'agreements', href: '/portal/agreements', icon: FileSignature, capability: 'manage_agreements' }, { label: 'documents', href: '/portal/documentos', icon: FolderLock },
  { label: 'profile', href: '/portal/profile', icon: UserRound }, { label: 'support', href: '/portal/support', icon: LifeBuoy },
  { label: 'brand', href: '/portal/branding', icon: SwatchBook, capability: 'manage_agency' },
];

const demoNavigation: NavigationItem[] = [
  { label: 'home', href: '/portal', icon: Grid2X2 },
  { label: 'clients', href: '/portal/clientes', icon: Users },
  { label: 'negotiations', href: '/portal/leads/new', icon: BarChart3 },
  { label: 'projects', href: '/portal/developer', icon: Building2 },
  { label: 'proposals', href: '/portal/proposals', icon: FileText },
];

const adminNavigation: NavigationItem[] = [
  { label: 'summary', href: '/portal/admin', icon: Grid2X2 }, { label: 'masterBrokers', href: '/portal/admin/brokers', icon: Building2, superAdminOnly: true },
  { label: 'team', href: '/portal/admin/users', icon: Users }, { label: 'brokerAccessRequests', href: '/portal/admin/broker-requests', icon: ClipboardList, capability: 'review_broker_access_requests' }, { label: 'globalProjects', href: '/portal/admin/projects', icon: Layers3 }, { label: 'brokerEvents', href: '/portal/admin/eventos', icon: Video },
  { label: 'reportingAccess', href: '/portal/admin/reporting-access', icon: Eye, superAdminOnly: true },
  { label: 'marketingOffers', href: '/portal/admin/offers', icon: Tag, capability: 'manage_marketing_offers' },
  { label: 'salesAndReservations', href: '/portal/admin/reservations', icon: FileCheck2 },
  { label: 'analytics', href: '/portal/admin/analytics', icon: Activity },
  { label: 'seoOptimizer', href: '/portal/admin/seo', icon: Search },
  { label: 'audit', href: '/portal/audit', icon: ShieldCheck },
  { label: 'translations', href: '/portal/admin/translations', icon: Languages },
  { label: 'systemLogs', href: '/portal/admin/system-logs', icon: Terminal, superAdminOnly: false },
  { label: 'settings', href: '/portal/admin/settings', icon: Settings },
];

const devNavigation: NavigationItem[] = [
  { label: 'operationsCenter', href: '/portal/dev', icon: Grid2X2 }, { label: 'team', href: '/portal/admin/users', icon: Users },
  { label: 'organizations', href: '/portal/admin/brokers', icon: Building2 }, { label: 'projects', href: '/portal/admin/projects', icon: Layers3 },
  { label: 'audit', href: '/portal/audit', icon: ShieldCheck }, { label: 'translations', href: '/portal/admin/translations', icon: Languages },
  { label: 'commissions', href: '/portal/comisiones', icon: CircleDollarSign },
  { label: 'support', href: '/portal/support', icon: LifeBuoy }, { label: 'integrations', href: '/portal/dev#integrations', icon: Webhook },
];

const developerOrgNavigation: NavigationItem[] = [
  { label: 'projects', href: '/portal/developer', icon: Building2 },
  { label: 'commissions', href: '/portal/comisiones', icon: CircleDollarSign, capability: 'view_commission_reports' },
];

const reportingNavigation: NavigationItem[] = [
  { label: 'summary', href: '/portal/master-reporting', icon: BarChart3 },
];

export default function PortalShell({
  children,
  currentUser,
  marketingOffers = [],
  hasMasterReporting = false,
}: {
  children: React.ReactNode;
  currentUser?: CurrentSessionUser | null;
  marketingOffers?: MarketingOffer[];
  hasMasterReporting?: boolean;
}) {
  const { t } = useLocale();
  const isDemo = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo';
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const routeMode: WorkspaceMode = pathname.startsWith('/portal/admin')
    ? 'administration'
    : pathname.startsWith('/portal/dev')
    ? 'platform'
    : pathname.startsWith('/portal/developer')
    ? 'developer'
    : pathname.startsWith('/portal/master-reporting')
    ? 'master_reporting'
    : pathname.startsWith('/portal/audit') && currentUser?.role === 'support_auditor'
    ? 'administration'
    : pathname.startsWith('/portal/audit') && (currentUser?.role === 'master_broker_admin' || currentUser?.role === 'super_admin')
    ? 'administration'
    : 'commercial';
  const role = currentUser?.role;
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(routeMode);
  const availableModes = useMemo<WorkspaceMode[]>(() => {
    const base: WorkspaceMode[] = isDemo ? ['commercial'] : role === 'super_admin'
    ? ['platform', 'commercial', 'administration', 'developer']
    : role === 'master_broker_admin' || role === 'master_broker_operations'
    ? ['commercial', 'administration']
    : role === 'developer_admin' || role === 'developer_viewer'
    ? ['developer']
    : ['commercial'];
    return !isDemo && hasMasterReporting ? [...base, 'master_reporting'] : base;
  }, [role, hasMasterReporting, isDemo]);
  const mode = availableModes.includes(workspaceMode) ? workspaceMode : availableModes[0];
  const commercialNavigation: NavigationItem[] = isDemo ? demoNavigation : currentUser?.role && hasCapability(currentUser.role, 'manage_agency_users')
    ? [...brokerNavigation.slice(0, 2), { label: 'team', href: '/portal/admin/users', icon: Users }, ...brokerNavigation.slice(2)]
    : brokerNavigation;
  const navigation: NavigationItem[] =
    mode === 'administration'
      ? adminNavigation
      : mode === 'platform'
      ? devNavigation
      : mode === 'developer'
      ? developerOrgNavigation
      : mode === 'master_reporting'
      ? reportingNavigation
      : commercialNavigation;
  const filteredNavigation = navigation.filter((item) =>
    (!item.capability || hasCapability(currentUser?.role, item.capability))
    && (!item.superAdminOnly || currentUser?.role === 'super_admin')
  );
  const roleLabel =
    mode === 'administration'
      ? t('masterAdministration')
      : mode === 'platform'
      ? t('developerPanel')
      : mode === 'developer'
      ? t('developerPanel')
      : mode === 'master_reporting'
      ? t('masterBrokers')
      : t('commercialCrm');

  const displayName = currentUser?.displayName || 'Osvaldo Bello';
  const displayRole = currentUser ? (roleLabels[currentUser.role] || currentUser.role) : 'Master Broker';
  const orgName = currentUser?.organization?.name || 'OB Brokers Team';

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') return;
    if (typeof window === 'undefined') return;
    const storageKey = 'ob_presence_session';
    let sessionKey = window.sessionStorage.getItem(storageKey);
    if (!sessionKey) {
      sessionKey = `${crypto.randomUUID().replace(/-/g, '')}`;
      window.sessionStorage.setItem(storageKey, sessionKey);
    }
    const heartbeat = () => {
      void import('@/app/portal/analytics-actions').then(({ recordPresenceAction }) => recordPresenceAction({ sessionKey: sessionKey!, surface: 'crm' }));
    };
    heartbeat();
    const interval = window.setInterval(heartbeat, 60_000);
    return () => window.clearInterval(interval);
  }, [isDemo]);

  function selectWorkspace(nextMode: WorkspaceMode) {
    setWorkspaceMode(nextMode);
    setMobileOpen(false);
    router.push(workspaceMeta[nextMode].href);
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-800">
      {mobileOpen && (
        <UITranslationBoundary attributes={["aria-label"]}><button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        /></UITranslationBoundary>
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-blue-100 bg-white transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative flex h-20 items-center justify-center border-b border-slate-100 px-5">
          <Link
            href="/portal"
            className="flex min-w-0 w-full items-center justify-center px-10"
            onClick={() => setMobileOpen(false)}
          >
            <BrandLogo size="xl" variant="dark" className="max-w-[210px]" />
            <span className="sr-only">{roleLabel}</span>
          </Link>
          <UITranslationBoundary attributes={["aria-label"]}><button
            type="button"
            aria-label="Cerrar navegación"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button></UITranslationBoundary>
        </div>

        <UITranslationBoundary attributes={["aria-label"]}><nav
          className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6"
          aria-label="Navegación principal"
        >
          <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            {t('workspace')}
          </p>
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const cleanHref = item.href.split('#')[0];
              const active =
                cleanHref === '/portal' || cleanHref === '/portal/admin'
                  ? pathname === cleanHref
                  : pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px]',
                      active ? 'text-blue-600' : 'text-slate-400'
                    )}
                  />
                  {t(item.label)}
                </Link>
              );
            })}
          </div>

          {availableModes.length > 1 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                {t('switchWorkspace')}
              </p>
              <div className="space-y-1">
                {availableModes.map((item) => {
                  const details = workspaceMeta[item];
                  const Icon = details.icon;
                  return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectWorkspace(item)}
                    className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold transition', mode === item ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950')}
                  >
                    <Icon className={cn('h-4 w-4', mode === item ? 'text-blue-600' : 'text-slate-400')} />
                    <span className="flex-1">{t(details.label)}</span>
                    {mode === item && <span className="text-[9px] font-extrabold uppercase tracking-wide">{t('active')}</span>}
                  </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav></UITranslationBoundary>

        {/* User Identity Footer Menu */}
        <div className="relative border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs">
              {displayName
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-slate-900">
                {displayName}
              </span>
              <span className="block truncate text-[10px] text-slate-500">
                {displayRole} · {orgName}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-slate-400 transition-transform',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-[11px] font-bold text-slate-900">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'admin@obbrokers.com'}</p>
              </div>
              <Link
                href="/portal/profile"
                prefetch={false}
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4 text-slate-400" />
                <span>{t('professionalProfile')}</span>
              </Link>
              <form action={async () => {
                if (isDemo) return (await import('@/app/auth/demo-actions')).logoutDemoAction();
                return (await import('@/app/auth/actions')).logoutAction();
              }}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('logout')}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-2 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-xl sm:gap-4 sm:px-6 lg:px-8">
          <UITranslationBoundary attributes={["aria-label"]}><button
            type="button"
            aria-label="Abrir navegación"
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button></UITranslationBoundary>
          {!isDemo && currentUser?.realRole === 'super_admin' && (
            <div className="shrink-0 lg:hidden">
              <UserSwitcher
                isPreviewMode={currentUser.isPreviewMode}
                previewUserName={currentUser.isPreviewMode ? displayName : undefined}
                previewOrgName={currentUser.isPreviewMode ? orgName : undefined}
                mobileIcon
              />
            </div>
          )}
          <UITranslationBoundary attributes={["aria-label"]}><Link
            href="/portal"
            prefetch={false}
            aria-label="Ir al inicio del portal"
            className="flex h-12 min-w-0 flex-1 items-center justify-center lg:hidden"
          >
            <BrandLogo size="sm" className="h-7 max-w-[88px] sm:h-9 sm:max-w-[142px]" />
          </Link></UITranslationBoundary>
          <label className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <UITranslationBoundary attributes={["aria-label"]}><input
              aria-label="Buscar"
              placeholder={t('search')}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            /></UITranslationBoundary>
          </label>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-black text-slate-900 leading-none">
                {displayName}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                {orgName}
              </span>
            </div>
            {currentUser && !currentUser.isPreviewMode && (
              <OrganizationSwitcher memberships={currentUser.availableMemberships} activeId={currentUser.membershipId} />
            )}
            {!isDemo && currentUser?.realRole === 'super_admin' && (
              <div className="hidden lg:block">
                <UserSwitcher
                  isPreviewMode={currentUser.isPreviewMode}
                  previewUserName={currentUser.isPreviewMode ? displayName : undefined}
                  previewOrgName={currentUser.isPreviewMode ? orgName : undefined}
                />
              </div>
            )}
            <PwaManager />
            <LanguageSwitcher />
            {!isDemo && <NotificationBell />}
          </div>
        </header>
        {currentUser?.isPreviewMode && (
          <div className="border-b-2 border-amber-300 bg-amber-50 px-4 py-2 text-center">
            <span className="text-xs font-bold text-amber-800">
              <Eye className="mr-1.5 inline h-3.5 w-3.5" /><LocalizedText text={"Estás viendo el portal como "} /><strong>{displayName}</strong> ({orgName})
            </span>
          </div>
        )}
        <main className="mx-auto min-h-[calc(100vh-5rem)] min-w-0 max-w-[1500px] overflow-x-clip p-4 sm:p-6 lg:p-8">
          <MarketingOfferSpotlight offers={marketingOffers} />
          {children}
        </main>
      </div>
    </div>
  );
}
