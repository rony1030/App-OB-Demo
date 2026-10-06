'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Calculator, ChevronRight, Download, FileText, LayoutGrid, Lock, Search, UserCheck } from 'lucide-react';
import type { CurrentSessionUser } from '@/lib/auth/get-user';
import type { PortalProject, PortalUnit } from '@/lib/portal-projects';
import { formatCurrencyExplicit, cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/supabase/storage';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';

export interface CanaRockDeveloperHubProps {
  projects: PortalProject[];
  currentUser: CurrentSessionUser | null;
}

const CANA_ROCK_CARDS = [
  {
    key: 'star',
    slug: 'cana-rock-star',
    name: 'Cana Rock Star',
    cover: 'https://osvaldobello.com/uploads/props/temp/cover-55905e36-1776108202886-01.jpg',
    statusTag: 'Listo para entrega',
    description: 'Residencial moderno en Cana Bay junto al Hard Rock Golf Club, con unidades listas para entrega inmediata.',
    startingPrice: 165000,
    renderGallery: [
      'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/06/Sala-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Exterior-Nocturno-1-web-1-scaled.jpg',
    ],
  },
  {
    key: 'universe',
    slug: 'cana-rock-universe',
    name: 'Cana Rock Universe',
    cover: 'https://osvaldobello.com/uploads/props/34/cover-b0787d74-1775506508990-Exterior_Universe_1.jpg',
    statusTag: 'Mayo 2027',
    description: 'Combinación de diseño ecológico tropical y estilo de vida de resort de clase mundial dentro de Cana Bay.',
    startingPrice: 190000,
    renderGallery: [
      'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/002-2.jpg',
    ],
  },
  {
    key: 'galaxy',
    slug: 'cana-rock-galaxy',
    name: 'Cana Rock Galaxy',
    cover: 'https://osvaldobello.com/uploads/props/35/cover-1fdca7cd-1776619759517-1.jpeg',
    statusTag: 'Agosto 2026',
    description: 'Proyecto residencial vanguardista con apartamentos inteligentes y vistas panorámicas al campo de golf.',
    startingPrice: 220000,
    renderGallery: [
      'https://canarock.info/wp-content/uploads/2021/09/001-1.jpg',
    ],
  },
  {
    key: 'stelar',
    slug: 'cana-rock-stelar',
    name: 'Cana Rock Cosmos Stelar',
    cover: 'https://canarock.info/wp-content/uploads/2023/05/230426_Cosmos_Aerea-01_Final-scaled.jpg',
    statusTag: 'Diciembre 2027',
    description: 'Nuevo hito arquitectónico con master plan integrado, amenidades de lujo y excelente retorno de inversión.',
    startingPrice: 144200,
    renderGallery: [
      'https://canarock.info/wp-content/uploads/2023/05/230426_Cosmos_Aerea-01_Final-scaled.jpg',
    ],
  },
];

export default function CanaRockDeveloperHub({
  projects,
  currentUser,
}: CanaRockDeveloperHubProps) {
  const { t, autoTranslate } = useLocale();
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bedroomFilter, setBedroomFilter] = useState<string>('all');

  const isAuthenticated = Boolean(currentUser);

  // Collect all public units across Cana Rock projects
  const allCanaRockUnits = useMemo(() => {
    const list: (PortalUnit & { projectSlug: string; projectName: string })[] = [];
    projects.forEach((proj) => {
      const isCanaRock =
        proj.slug.includes('cana-rock') ||
        proj.developer?.toLowerCase().includes('cana rock');
      if (!isCanaRock) return;

      (proj.units || []).forEach((u) => {
        if (u.isPublic !== false && u.status === 'Disponible') {
          list.push({
            ...u,
            projectSlug: proj.slug,
            projectName: proj.name,
          });
        }
      });
    });
    return list;
  }, [projects]);

  const filteredUnits = useMemo(() => {
    return allCanaRockUnits.filter((unit) => {
      if (selectedProjectFilter !== 'all' && unit.projectSlug !== selectedProjectFilter) {
        return false;
      }
      if (bedroomFilter !== 'all' && unit.bedrooms !== Number(bedroomFilter)) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesCode = unit.unit.toLowerCase().includes(q);
        const matchesTower = (unit.tower || '').toLowerCase().includes(q);
        const matchesProj = unit.projectName.toLowerCase().includes(q);
        if (!matchesCode && !matchesTower && !matchesProj) return false;
      }
      return true;
    });
  }, [allCanaRockUnits, selectedProjectFilter, bedroomFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-slate-800 font-sans relative flex flex-col justify-between selection:bg-[#CA9F47]/30 selection:text-[#0a1140]">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#CA9F47]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0a1140]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Brand Header */}
      <header className="border-b border-slate-200/60 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <UITranslationBoundary attributes={["alt"]}><img
                  src="https://canarock.info/wp-content/uploads/2021/09/cropped-canarock-favicon-logo-32x32.png"
                  alt="Cana Rock"
                  className="h-full w-full object-contain"
                /></UITranslationBoundary>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black tracking-widest text-[#0a1140] leading-none uppercase"><LocalizedText text={"Cana Rock"} /></span>
                <span className="text-[8px] font-bold tracking-[0.2em] text-[#CA9F47] mt-0.5 uppercase"><LocalizedText text={"Broker Portal • OB Brokers Team"} /></span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition"
            >
              <span>← {t('allDevelopers')}</span>
            </Link>

            <PublicLanguageSwitcher circular />

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-black text-slate-900 leading-none">
                    {currentUser?.displayName}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">
                    {currentUser?.organization.name}
                  </span>
                </div>
                <Link
                  href="/portal"
                  className="px-4 py-2 bg-[#0a1140] hover:bg-[#141e54] text-[#CA9F47] rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-sm flex items-center gap-2"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t('myPortal')}</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/login?next=/desarrolladores/cana-rock"
                className="px-5 py-2.5 bg-[#0a1140] hover:bg-[#121c5c] text-white hover:text-amber-200 rounded-full text-[10px] font-black uppercase tracking-widest transition shadow-sm hover:scale-[1.02] flex items-center gap-2"
              >
                <Lock className="w-3 h-3 text-[#CA9F47]" />
                <span>{t('brokerAccess')}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-10 pb-28 md:py-14 space-y-12 relative z-10 flex-1 w-full">
        {/* Hero Banner (matches live cana-rock.osvaldobello.com) */}
        <div className="relative rounded-[2.8rem] sm:rounded-[3.5rem] bg-gradient-to-br from-[#0a1140] via-[#0f1954] to-[#121c5c] text-white p-8 md:p-14 overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="absolute inset-0 bg-luxury-grid opacity-10 pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#CA9F47]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="space-y-4 text-left max-w-2xl relative z-10">
            <span className="text-[9px] font-black text-[#CA9F47] uppercase tracking-[0.25em] bg-white/10 px-4 py-2 rounded-full border border-white/10 inline-block"><LocalizedText text={"Cana Rock Broker Portal"} /></span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic font-sans mt-2">
              {autoTranslate('Herramientas para Asesores')}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
              {autoTranslate('Acceda a la disponibilidad oficial en tiempo real, descargue fichas técnicas, realice cotizaciones inmediatas y genere propuestas personalizadas con su logo en segundos.')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 relative z-10 shrink-0 w-full md:w-auto">
            <Link
              href={isAuthenticated ? '/portal/proposals/new' : '/login?next=/portal/proposals/new'}
              className="flex items-center justify-center gap-2 px-8 py-4 sm:py-5 bg-[#CA9F47] hover:bg-[#b88c3a] text-[#0a1140] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition hover:scale-[1.02] w-full sm:w-auto"
            >
              <Calculator className="w-4 h-4" />
              <span>{autoTranslate('Generar Propuesta')}</span>
            </Link>
          </div>
        </div>

        {/* Two-Column Section: NUESTROS PROYECTOS (Left) + HERRAMIENTAS (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column (8 cols): NUESTROS PROYECTOS */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-end border-b border-slate-200/80 pb-4">
              <div className="text-left">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                  {autoTranslate('Nuestros Proyectos')}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {autoTranslate('Seleccione un desarrollo para ver material y disponibilidad')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {CANA_ROCK_CARDS.map((item, index) => {
                const projectData = projects.find((project) => project.slug === item.slug);
                const projectCover = projectData?.image || projectData?.gallery?.[0];
                const coverSource = projectCover || (item.slug === 'cana-rock-star' ? '' : item.cover);
                const coverUrl = coverSource ? getOptimizedImageUrl(coverSource, {
                  width: 960,
                  height: 600,
                  quality: 84,
                  format: 'webp',
                }) : '';

                return (
                <Link
                  key={item.key}
                  href={`/proyectos/${item.slug}`}
                  className="group rounded-[2.2rem] bg-white border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col text-left"
                >
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={item.name}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400"><LocalizedText text={"Imagen del proyecto no disponible"} /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black text-[#0a1140] uppercase tracking-wider shadow-xs">
                      {autoTranslate(item.statusTag)}
                    </div>
                  </div>

                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-[9px] font-extrabold text-[#CA9F47] uppercase tracking-wider mt-1">
                        {autoTranslate('Ver Disponibilidad & Recursos')}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#CA9F47] group-hover:text-[#0a1140] group-hover:border-[#CA9F47] transition-all duration-300 shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>

          {/* Right Column (4 cols): HERRAMIENTAS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="text-left border-b border-slate-200/80 pb-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                {autoTranslate('Herramientas')}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {autoTranslate('Accesos rápidos y recursos de ventas')}
              </p>
            </div>

            <div className="space-y-4">
              {/* Card 1: Generar Propuesta */}
              <Link
                href={isAuthenticated ? '/portal/proposals/new' : '/login?next=/portal/proposals/new'}
                className="flex items-center justify-between rounded-lg border border-[#CA9F47]/40 bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#CA9F47]/10 flex items-center justify-center text-[#CA9F47] group-hover:bg-[#CA9F47] group-hover:text-[#0a1140] transition-all shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {autoTranslate('Generar Propuesta')}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {autoTranslate('Crear enlace de cotización para clientes')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#CA9F47] transition-colors" />
              </Link>

              {/* Card 2: Ver Disponibilidades */}
              <a
                href="#disponibilidad-en-vivo"
                className="flex items-center justify-between rounded-lg border border-[#CA9F47]/40 bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#CA9F47]/10 flex items-center justify-center text-[#CA9F47] group-hover:bg-[#CA9F47] group-hover:text-[#0a1140] transition-all shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {autoTranslate('Ver Disponibilidades')}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {autoTranslate('Consultar inventario oficial y precios en tiempo real')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#CA9F47] transition-colors" />
              </a>

              {/* Card 3: CRM & Dashboard */}
              <Link
                href={isAuthenticated ? '/portal' : '/login?next=/portal'}
                className="flex items-center justify-between rounded-lg border border-[#0a1140]/20 bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#0a1140]/10 flex items-center justify-center text-[#0a1140] group-hover:bg-[#0a1140] group-hover:text-white transition-all shrink-0">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#0a1140] uppercase tracking-wide"><LocalizedText text={"CRM &amp; Dashboard"} /></h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5"><LocalizedText text={"Gestionar leads, CMS e inventarios oficiales"} /></p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0a1140] transition-colors" />
              </Link>

              {/* Card 4: BROCHURES Y RENDERS CON TU LOGO (Personalización Exclusiva) */}
              <div className="p-5 bg-gradient-to-br from-[#0a1140] to-[#121c5c] text-white rounded-3xl shadow-md space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 bg-[#CA9F47]/20 border border-[#CA9F47]/30 px-2.5 py-1 rounded-full text-[8.5px] font-black text-[#CA9F47] uppercase tracking-wider">
                    <span><LocalizedText text={"Material con Tu Logo"} /></span>
                  </div>
                  {isAuthenticated && (
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /><LocalizedText text={" Habilitado"} /></span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-tight text-white"><LocalizedText text={"Brochures, Renders &amp; Dossiers"} /></h4>
                  <p className="text-[10px] text-slate-300 leading-relaxed mt-1 font-medium">
                    {isAuthenticated
                      ? `Descarga presentaciones oficiales personalizadas con el logo y contacto de ${currentUser?.organization.name}.`
                      : <LocalizedText text={"Inicia sesión como broker para descargar el material oficial de Cana Rock automáticamente personalizado con tu logotipo."} />}
                  </p>
                </div>

                {isAuthenticated ? (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <Link
                      href="/portal/projects/cana-rock-star/dossier"
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#CA9F47]" /><LocalizedText text={"Dossier Cana Rock Star (con logo)"} /></span>
                      <Download className="w-3.5 h-3.5 text-slate-300" />
                    </Link>

                    <Link
                      href="/portal/projects/cana-rock-stelar/dossier"
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#CA9F47]" /><LocalizedText text={"Dossier Cosmos Stelar (con logo)"} /></span>
                      <Download className="w-3.5 h-3.5 text-slate-300" />
                    </Link>

                  </div>
                ) : (
                  <div className="pt-2">
                    <Link
                      href="/login?next=/desarrolladores/cana-rock"
                      className="w-full py-2.5 bg-[#CA9F47] hover:bg-[#b88c3a] text-[#0a1140] font-black text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Lock className="w-3 h-3" />
                      <span><LocalizedText text={"Ingresar para Descargar con Logo"} /></span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Live Availability Explorer Section */}
        <section id="disponibilidad-en-vivo" className="mt-16 border-t border-slate-200/80 pt-16 space-y-6 text-left scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[9px] font-black text-[#CA9F47] uppercase tracking-[0.25em] block mb-1"><LocalizedText text={"Inventario Oficial Cana Rock"} /></span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase"><LocalizedText text={"Disponibilidad en Tiempo Real"} /></h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                {allCanaRockUnits.length}<LocalizedText text={" unidades disponibles consolidadas en los 4 proyectos de Cana Bay."} /></p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Project selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedProjectFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition',
                    selectedProjectFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  )}
                ><LocalizedText text={"Todos ("} />{allCanaRockUnits.length})
                </button>
                {CANA_ROCK_CARDS.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setSelectedProjectFilter(c.slug)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition',
                      selectedProjectFilter === c.slug
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    )}
                  >
                    {c.name.replace('Cana Rock ', '')}
                  </button>
                ))}
              </div>

              {/* Bedrooms filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setBedroomFilter('all')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition',
                    bedroomFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  )}
                ><LocalizedText text={"Cualquier Hab."} /></button>
                <button
                  type="button"
                  onClick={() => setBedroomFilter('1')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition',
                    bedroomFilter === '1' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  )}
                ><LocalizedText text={"1 Hab"} /></button>
                <button
                  type="button"
                  onClick={() => setBedroomFilter('2')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition',
                    bedroomFilter === '2' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  )}
                ><LocalizedText text={"2 Hab"} /></button>
                <button
                  type="button"
                  onClick={() => setBedroomFilter('3')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition',
                    bedroomFilter === '3' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  )}
                ><LocalizedText text={"3 Hab"} /></button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="text"
              placeholder="Buscar por código de unidad o torre…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#CA9F47]"
            /></UITranslationBoundary>
          </div>

          {/* Units Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {filteredUnits.slice(0, 24).map((unit) => (
              <div
                key={`${unit.projectSlug}-${unit.id}`}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#CA9F47] transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {unit.projectName.replace('Cana Rock ', '')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {unit.status}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 mt-1"><LocalizedText text={"Unidad "} />{unit.unit}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {unit.tower ? `Torre ${unit.tower} • ` : ''}<LocalizedText text={"Nivel "} />{unit.floor || 1}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block"><LocalizedText text={"Precio Lista"} /></span>
                    <span className="text-sm font-black text-[#0a1140]">
                      {formatCurrencyExplicit(unit.price, unit.currency || 'USD')}
                    </span>
                  </div>

                  <UITranslationBoundary attributes={["title"]}><Link
                    href={`/proyectos/${unit.projectSlug}`}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-[#CA9F47] hover:text-[#0a1140] text-slate-600 transition"
                    title="Ver proyecto"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link></UITranslationBoundary>
                </div>
              </div>
            ))}
          </div>

          {filteredUnits.length > 24 && (
            <div className="text-center pt-4">
              <p className="text-xs text-slate-500"><LocalizedText text={"Mostrando 24 de "} />{filteredUnits.length}<LocalizedText text={" unidades disponibles. Usa los filtros para acotar la búsqueda."} /></p>
            </div>
          )}
        </section>

        {/* Benefits & Program Section (Aliados) */}
        <section className="mt-16 border-t border-slate-200/80 pt-16 space-y-8 text-left">
          <div className="max-w-3xl">
            <span className="text-[9px] font-black text-[#CA9F47] uppercase tracking-[0.25em] block mb-2"><LocalizedText text={"Beneficios de Venta"} /></span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase"><LocalizedText text={"Programa Comercial de Aliados"} /></h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2"><LocalizedText text={"Únete a nuestra red de comercialización y accede a los esquemas de comisiones disponibles para el mercado turístico inmobiliario."} /></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#0a1140] to-[#121c5c] text-white rounded-[2.5rem] p-8 shadow-xl border border-white/5 flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-4 relative z-10">
                <div className="inline-flex bg-[#CA9F47]/25 border border-[#CA9F47]/25 px-3.5 py-1.5 rounded-full text-[8.5px] font-black text-[#CA9F47] uppercase tracking-wider"><LocalizedText text={"Agencias Inmobiliarias"} /></div>
                <h3 className="text-2xl font-black italic uppercase font-serif"><LocalizedText text={"Agencia Aliada"} /></h3>
                <p className="text-xs text-slate-300 leading-relaxed"><LocalizedText text={"Para agencias inmobiliarias constituidas que registran volumen de ventas anual consolidado por su equipo de agentes."} /></p>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400"><LocalizedText text={"Comisiones:"} /></span>
                    <span className="text-[#CA9F47]"><LocalizedText text={"Esquema Escalable Competitivo"} /></span>
                  </div>
                </div>
              </div>
              <div className="mt-8 relative z-10">
                <Link
                  href={isAuthenticated ? '/portal' : '/login?next=/portal'}
                  className="w-full py-4 bg-[#CA9F47] hover:bg-[#b88c3a] text-[#0a1140] font-black uppercase text-[10px] tracking-widest rounded-2xl transition flex items-center justify-center gap-2"
                ><LocalizedText text={"Registrar mi Agencia (RNC)"} /></Link>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-4 relative z-10">
                <div className="inline-flex bg-[#0a1140]/5 border border-[#0a1140]/10 px-3.5 py-1.5 rounded-full text-[8.5px] font-black text-[#0a1140] uppercase tracking-wider"><LocalizedText text={"Referidores Individuales"} /></div>
                <h3 className="text-2xl font-black italic uppercase font-serif text-[#0a1140]"><LocalizedText text={"Referidor Estrella"} /></h3>
                <p className="text-xs text-slate-500 leading-relaxed"><LocalizedText text={"Para personas naturales, asesores independientes o clientes que recomiendan directamente nuestros desarrollos."} /></p>
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500"><LocalizedText text={"Comisiones:"} /></span>
                    <span className="text-[#0a1140]"><LocalizedText text={"Consultar esquema comercial"} /></span>
                  </div>
                </div>
              </div>
              <div className="mt-8 relative z-10">
                <Link
                  href={isAuthenticated ? '/portal' : '/login?next=/portal'}
                  className="w-full py-4 bg-[#0a1140] hover:bg-[#141e54] text-[#CA9F47] font-black uppercase text-[10px] tracking-widest rounded-2xl transition flex items-center justify-center gap-2"
                ><LocalizedText text={"Quiero ser Referidor"} /></Link>
              </div>
            </div>
          </div>
        </section>

        {/* Cana Bay Amenities Section */}
        <section className="mt-16 border-t border-slate-200/80 pt-16 space-y-8 text-left">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase"><LocalizedText text={"Amenidades de Cana Bay"} /></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1"><LocalizedText text={"El privilegio de vivir en el mejor complejo del Caribe"} /></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group rounded-[2.2rem] bg-white border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col text-left">
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <UITranslationBoundary attributes={["alt"]}><img
                  src="https://canabay.com.do/media/zoo/images/compressed_compressed_DSCF3889_1_5f5e2986f90f479a59bc1863bae1a0f0.jpg"
                  alt="Club de Playa Cana Bay"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                /></UITranslationBoundary>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#CA9F47] leading-tight"><LocalizedText text={"Club de Playa Cana Bay"} /></h3>
                  <p className="text-[10px] text-slate-200 leading-snug"><LocalizedText text={"Con sus 11,000 m² y piscina infinity frente al mar, es el centro social exclusivo del resort."} /></p>
                </div>
              </div>
            </div>

            <div className="group rounded-[2.2rem] bg-white border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col text-left">
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <UITranslationBoundary attributes={["alt"]}><img
                  src="https://canabay.com.do/media/zoo/images/compressed_D_1_1_1e17c175d1d84e8bcb190280d3a0310c.jpg"
                  alt="Club Raquet"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                /></UITranslationBoundary>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#CA9F47] leading-tight"><LocalizedText text={"Club Raquet"} /></h3>
                  <p className="text-[10px] text-slate-200 leading-snug"><LocalizedText text={"Dos canchas de tenis y dos de pádel de césped artificial para jugar de día o bajo iluminación nocturna."} /></p>
                </div>
              </div>
            </div>

            <div className="group rounded-[2.2rem] bg-white border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col text-left">
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <UITranslationBoundary attributes={["alt"]}><img
                  src="https://canabay.com.do/media/zoo/images/bg-about_dea0d47f533608ab92fdcd044cb55c6a.png"
                  alt="Hard Rock Golf Club"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                /></UITranslationBoundary>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#CA9F47] leading-tight"><LocalizedText text={"Hard Rock Golf Club"} /></h3>
                  <p className="text-[10px] text-slate-200 leading-snug"><LocalizedText text={"Campo de campeonato de 18 hoyos Par 72 diseñado por Jack Nicklaus a través de paisajes dominicanos."} /></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-[#070b19] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white p-0.5 border border-white/20">
              <UITranslationBoundary attributes={["alt"]}><img
                src="https://canarock.info/wp-content/uploads/2021/09/cropped-canarock-favicon-logo-32x32.png"
                alt="Cana Rock"
                className="h-full w-full object-contain"
              /></UITranslationBoundary>
            </div>
            <div>
              <span className="text-xs font-black tracking-widest uppercase"><LocalizedText text={"Cana Rock"} /></span>
              <p className="text-[8px] text-[#CA9F47] font-bold uppercase tracking-wider"><LocalizedText text={"Operado por OB Master Brokers"} /></p>
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-400 flex flex-col sm:flex-row items-center gap-2">
            <span>© {new Date().getFullYear()}<LocalizedText text={" OB Brokers Team. Todos los derechos reservados."} /></span>
            <Link href="/" className="text-slate-500 hover:text-white transition"><LocalizedText text={"ob-brokers.com"} /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
