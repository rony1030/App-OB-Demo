'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Layers, FileSignature, Users, Network, Mail, BarChart3, Settings, FileText, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBrand } from '../branding/BrandProvider';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Proyectos Master', href: '/projects', icon: Building2 },
  { name: 'Inventario en Vivo', href: '/inventory', icon: Layers },
  { name: 'Propuestas Multi-Propiedad', href: '/proposals', icon: FileSignature },
  { name: 'Dossiers Interactivos', href: '/dossier', icon: FileText },
  { name: 'Firmas & Acuerdos', href: '/firmas', icon: ShieldCheck },
  { name: 'Leads & Pipeline', href: '/leads', icon: Users },
  { name: 'Red de Inmobiliarias', href: '/network', icon: Network },
  { name: 'Email Marketing', href: '/marketing', icon: Mail },
  { name: 'Reportes & Ventas', href: '/reports', icon: BarChart3 },
  { name: 'Ajustes Marca Blanca', href: '/settings', icon: Settings },
];

export default function BrokerSidebar() {
  const pathname = usePathname();
  const { theme } = useBrand();

  return (
    <aside className="w-72 bg-brand-primary text-white flex flex-col h-screen border-r border-white/10 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-brand-secondary/20 border border-brand-secondary/40 flex items-center justify-center text-brand-secondary font-black text-lg shrink-0">
            {theme.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight text-white truncate">{theme.name}</h1>
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-accent truncate"><LocalizedText text={"Master Broker Portal"} /></p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all group",
                isActive
                  ? "bg-white/15 text-white shadow-md border border-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-brand-secondary" : "text-white/50 group-hover:text-white")} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-secondary" />}
            </Link>
          );
        })}
      </nav>

      {/* User / Agency Footer */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-xl bg-brand-accent/20 text-brand-accent flex items-center justify-center font-black text-xs"><LocalizedText text={"MB"} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate"><LocalizedText text={"Master Broker Admin"} /></p>
            <p className="text-[9px] text-white/50 truncate"><LocalizedText text={"admin@obmasterbrokers.com"} /></p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
