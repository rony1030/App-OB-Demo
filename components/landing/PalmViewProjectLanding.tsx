'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowUpRight, Check, ChevronDown, LockKeyhole, MapPin, Menu, X } from 'lucide-react';
import type { ProjectSalesLandingProps } from '@/components/landing/ProjectSalesLanding';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import LeadCaptureForm from '@/components/landing/LeadCaptureForm';
import BrandedGalleryDownload from '@/components/landing/BrandedGalleryDownload';
import availability from '@/lib/data/palm-view-availability.json';

const gallery = [
  '/projects/palm-view/gallery/exteriores-01-palm-view-aerea.jpg',
  '/projects/palm-view/gallery/exteriores-06-palm-view-torres.jpg',
  '/projects/palm-view/gallery/amenidades-3-casa-club-green.jpg',
  '/projects/palm-view/gallery/amenidades-piscina-torre-1.jpg',
  '/projects/palm-view/gallery/amenidades-club-raqueta.jpg',
  '/projects/palm-view/gallery/interiores-03-palm-view-cocina.jpg',
  '/projects/palm-view/gallery/interiores-03-palm-view-cocina.jpg',
  '/projects/palm-view/gallery/exteriores-04-palm-view-paseo.jpg',
  '/projects/palm-view/gallery/amenidades-10-pasarela-lago.jpg',
];

const resortAmenities = [
  ['Golf', 'Campo de golf de 18 hoyos integrado al paisaje.', 'golf'],
  ['Casa Club', 'Espacios sociales, piscina y vida al aire libre.', 'club'],
  ['Coral Beach', 'Club de playa privada para disfrutar el destino.', 'beach'],
  ['Hotel', 'Acceso a servicios y experiencias del resort.', 'hotel'],
  ['Parque y senderos', 'Paisaje natural, lagos y recorridos peatonales.', 'nature'],
  ['Club de raqueta', 'Deporte y recreación dentro del Coral Golf Resort.', 'sport'],
  ['Deporte AR', 'Áreas recreativas para complementar la experiencia.', 'activity'],
  ['Oficinas y servicios', 'Acceso a espacios comerciales y de operación.', 'service'],
];

const projectAmenities = [
  ['Espacios amueblados', 'Apartamentos listos para habitar desde el primer día.', 'home'],
  ['Piscinas para adultos y niños', 'Áreas acuáticas para descanso y convivencia.', 'pool'],
  ['Parque infantil', 'Un espacio pensado para las familias.', 'play'],
  ['Housekeeping', 'Servicio de apoyo para la operación y el cuidado de la unidad.', 'spark'],
  ['Conserjería', 'Atención y coordinación para residentes y huéspedes.', 'concierge'],
  ['Restaurante bar', 'Una experiencia gastronómica integrada al proyecto.', 'dining'],
  ['Sala de juntas', 'Espacios para reuniones y trabajo.', 'meeting'],
  ['Gimnasio y sauna', 'Bienestar diario sin salir del proyecto.', 'wellness'],
  ['Jacuzzi y sendero', 'Relajación y conexión con el paisaje.', 'nature'],
  ['Ascensores y parqueos', 'Comodidad operativa para cada apartamento.', 'access'],
];

const coralAmenityShowcase = [
  ['Acceso zona comercial', 'compras y servicios', 'service'], ['Hotel', 'servicios hoteleros', 'hotel'], ['Campo de golf', '18 hoyos integrados al paisaje', 'golf'],
  ['Casa club', 'espacios sociales y piscina', 'club'], ['Parque', 'naturaleza y descanso', 'nature'], ['Muelle', 'lagos y recorridos', 'beach'],
  ['Club raqueta', 'deporte y recreación', 'sport'], ['Deporte AR', 'actividad al aire libre', 'activity'], ['Coral Beach', 'playa privada', 'beach'],
  ['Oficinas', 'servicios y operación', 'access'], ['Camino ecológico', 'conexión con el paisaje', 'nature'], ['Parque senior', 'bienestar para todas las edades', 'wellness'],
];

const palmAmenityShowcase = [
  ['Espacios amueblados', 'listos para habitar', 'home'], ['Piscinas', 'adultos y niños', 'pool'], ['Parque infantil', 'espacio para familias', 'play'],
  ['Housekeeping', 'cuidado de la unidad', 'spark'], ['Conserjería', 'atención a residentes', 'concierge'], ['Restaurante bar', 'sabor dentro del proyecto', 'dining'],
  ['Sala de juntas', 'trabajo y reuniones', 'meeting'], ['Turco', 'bienestar diario', 'wellness'], ['Parqueaderos', 'comodidad operativa', 'access'],
  ['Gimnasio', 'movimiento y salud', 'activity'], ['Sauna', 'pausa y recuperación', 'spark'], ['Ascensores', 'conectividad por torre', 'hotel'],
  ['Jacuzzi', 'relajación', 'pool'], ['Sendero peatonal', 'caminar entre verde', 'nature'],
];

const rentabilityRows = [
  ['Ocupación estimada', '60%', '60%', '60%'],
  ['Noches ocupadas', '219', '219', '219'],
  ['Tarifa promedio / noche', 'US$120', 'US$170', 'US$210'],
  ['Ingreso anual bruto', 'US$26,280', 'US$37,230', 'US$45,990'],
  ['Ingreso después de operación', 'US$21,024', 'US$29,784', 'US$36,792'],
  ['Rendimiento referencial', '9.2%', '9.5%', '9.8%'],
];

const fallbackTypologies = [
  ['Tipo A', '2 habitaciones · 2 baños', '90.83–93.24 m²', '/projects/palm-view/typologies/tipo-a.png'],
  ['Tipo B', '3 habitaciones · 3 baños', '112.18–118.60 m²', '/projects/palm-view/typologies/tipo-b.png'],
  ['Tipo C', '2 habitaciones · 2.5 baños', '93.62–101.08 m²', '/projects/palm-view/typologies/tipo-c.png'],
  ['Tipo D', '2 habitaciones · 2.5 baños', '86.39–94.59 m²', '/projects/palm-view/typologies/tipo-d.png'],
  ['Tipo E', '1 habitación · 2 baños', '64.83–72.07 m²', null],
  ['Tipo F', '1 habitación · 2 baños', '71.32–73.79 m² · Torre 3', null],
  ['Tipo G', '1 habitación · 1 baño', '49.56–64.02 m²', null],
  ['Tipo H', '1 habitación · 1 baño', '49.56–64.02 m²', null],
  ['Tipo J', '2 habitaciones · 2 baños', '77.95–82.39 m²', null],
  ['Tipo K', '1 habitación · 1.5 baños', '65.79–66.81 m²', null],
];

function AmenityGlyph({ kind }: { kind: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const glyphs: Record<string, ReactNode> = {
    golf: <><path d="M12 3v16" {...common} /><path d="M12 4c4.5 0 7 1.3 8.5 3.2-3.7 1.2-6.5 1.2-8.5 0" {...common} /><path d="M5 21h14" {...common} /><circle cx="15.5" cy="18.5" r="2.5" {...common} /></>,
    club: <><path d="M4 20h16" {...common} /><path d="M6 20v-7h12v7" {...common} /><path d="M8 13V8h8v5" {...common} /><path d="M10 8V5h4v3" {...common} /></>,
    beach: <><path d="M4 19h16" {...common} /><path d="M12 19V7" {...common} /><path d="M12 8c-3.5-2.5-6-2-8 0 3.5 2 6.2 2.2 8 0Z" {...common} /><path d="M12 8c3.5-2.5 6-2 8 0-3.5 2-6.2 2.2-8 0Z" {...common} /></>,
    hotel: <><path d="M5 21V5h14v16" {...common} /><path d="M8 9h2M14 9h2M8 13h2M14 13h2" {...common} /><path d="M3 21h18" {...common} /><path d="M10 21v-4h4v4" {...common} /></>,
    nature: <><path d="M12 21V9" {...common} /><path d="M12 11c-5-1-7-4-7-8 5 0 7 3 7 8Z" {...common} /><path d="M12 15c5-1 7-4 7-8-5 0-7 3-7 8Z" {...common} /><path d="M5 21h14" {...common} /></>,
    sport: <><circle cx="12" cy="12" r="8" {...common} /><path d="m7 8 5 4 5-4M7 16l5-4 5 4" {...common} /></>,
    activity: <><circle cx="12" cy="5" r="2" {...common} /><path d="m8 21 2-7 2 2 2-2 2 7M10 10l-3 3M14 10l3 3" {...common} /></>,
    service: <><path d="M4 20V8l8-5 8 5v12" {...common} /><path d="M8 20v-5h8v5M8 10h.01M12 10h.01M16 10h.01" {...common} /></>,
    home: <><path d="m4 11 8-7 8 7" {...common} /><path d="M6 10v10h12V10M10 20v-5h4v5" {...common} /></>,
    pool: <><path d="M3 16c2-2 4 2 6 0s4 2 6 0 4 2 6 0" {...common} /><path d="M6 11c0-2 2-3 3-3s3 1 3 3M12 11c0-2 2-3 3-3s3 1 3 3" {...common} /><path d="M9 5v3M15 5v3" {...common} /></>,
    play: <><path d="M5 20h14M7 20v-8h10v8M9 12V7h6v5M4 7h16" {...common} /><path d="m9 7-2-3M15 7l2-3" {...common} /></>,
    spark: <><path d="M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" {...common} /><circle cx="12" cy="12" r="3" {...common} /></>,
    concierge: <><path d="M5 18a7 7 0 0 1 14 0" {...common} /><path d="M8 18v-2M16 18v-2M4 19h16" {...common} /><circle cx="12" cy="8" r="3" {...common} /></>,
    dining: <><path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M16 3v18M16 3c3 2 3 5 0 7" {...common} /></>,
    meeting: <><path d="M4 6h16v10H4zM8 20h8M12 16v4" {...common} /><path d="M8 10h8M8 13h5" {...common} /></>,
    wellness: <><path d="M8 21V9M16 21V9M6 12h12M7 5h10M9 3h6" {...common} /><path d="M8 17h8" {...common} /></>,
    access: <><path d="M5 20V5h14v15M3 20h18M9 9h6M9 13h6" {...common} /><path d="M10 20v-4h4v4" {...common} /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" {...common}>{glyphs[kind] || glyphs.service}</svg>;
}

function PalmViewExperienceShowcase({ project, typologyOptions }: { project: ProjectSalesLandingProps['project']; typologyOptions: string[] }) {
  const renderAmenityGrid = (items: string[][]) => <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">{items.map(([title, body, kind], index) => <article key={title} data-palm-reveal className="reveal-on-scroll group rounded-2xl border border-[#dce5d6] bg-white p-4 transition duration-500 hover:-translate-y-1 hover:border-[#a9c77d] hover:shadow-[0_18px_40px_rgba(33,65,43,.10)]"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef5e4] text-[#08783f] transition group-hover:bg-[#dbeabe]"><AmenityGlyph kind={kind} /></span><span className="text-[10px] font-bold text-[#b2c19e]">{String(index + 1).padStart(2, '0')}</span></div><h4 className="mt-4 text-xs font-bold text-[#29452f] sm:text-sm">{title}</h4><p className="mt-1 text-[11px] leading-4 text-[#718078]">{body}</p></article>)}</div>;

  return <>
    <section id="experiencia-visual" className="bg-white px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#6d8f3c]"><LocalizedText text={"El mapa de la experiencia"} /></p><h2 className="mt-5 font-serif text-5xl leading-[.94] tracking-[-.05em] text-[#24422b] sm:text-7xl"><LocalizedText text={"El entorno primero. El hogar después."} /></h2><p className="mt-6 text-sm leading-7 text-[#65746a]"><LocalizedText text={"Explora el resort y el proyecto como dos capas de una misma dirección. Cada imagen entra en escena y deja paso a sus amenidades."} /></p></div><div className="mt-16 space-y-24"><article data-palm-reveal className="reveal-on-scroll"><div className="overflow-hidden rounded-[2.5rem] border border-[#dce5d6] bg-[#f4f7ef] p-3 shadow-[0_24px_70px_rgba(33,65,43,.10)]"><div className="relative aspect-[16/8] overflow-hidden rounded-[2rem] bg-white"><UITranslationBoundary attributes={["alt"]}><Image src="/projects/palm-view/plans/coral-golf-resort-3d.png" alt="Plano 3D grande del Coral Golf Resort" fill sizes="100vw" className="object-contain p-3 transition duration-700 hover:scale-[1.025]" /></UITranslationBoundary></div></div><div className="mt-8 flex flex-col justify-between gap-4 border-b border-[#dce5d6] pb-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6d8f3c]"><LocalizedText text={"01 · Coral Golf Resort"} /></p><h3 className="mt-3 font-serif text-4xl tracking-[-.04em] text-[#24422b] sm:text-5xl"><LocalizedText text={"Un resort completo para vivirlo todo."} /></h3></div><p className="max-w-sm text-xs leading-5 text-[#718078]"><LocalizedText text={"Golf, playa, lagos, deporte y servicios en un paisaje conectado."} /></p></div>{renderAmenityGrid(coralAmenityShowcase)}</article><article data-palm-reveal className="reveal-on-scroll"><div className="overflow-hidden rounded-[2.5rem] border border-[#dce5d6] bg-[#f4f7ef] p-3 shadow-[0_24px_70px_rgba(33,65,43,.10)]"><div className="relative aspect-[16/8] overflow-hidden rounded-[2rem] bg-white"><UITranslationBoundary attributes={["alt"]}><Image src="/projects/palm-view/plans/palm-view-master-plan-3d.png" alt="Master plan 3D grande de Palm View" fill sizes="100vw" className="object-contain p-3 transition duration-700 hover:scale-[1.025]" /></UITranslationBoundary></div></div><div className="mt-8 flex flex-col justify-between gap-4 border-b border-[#dce5d6] pb-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6d8f3c]"><LocalizedText text={"02 · Palm View"} /></p><h3 className="mt-3 font-serif text-4xl tracking-[-.04em] text-[#24422b] sm:text-5xl"><LocalizedText text={"Comodidades que hacen fácil quedarse."} /></h3></div><p className="max-w-sm text-xs leading-5 text-[#718078]"><LocalizedText text={"Un proyecto residencial con servicios propios, ritmo tranquilo y operación hotelera."} /></p></div>{renderAmenityGrid(palmAmenityShowcase)}</article></div></div></section>
    <section id="rentabilidad" className="bg-[#eef3e7] px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start"><div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#6d8f3c]"><LocalizedText text={"Rentabilidad estimada"} /></p><h2 className="mt-5 font-serif text-5xl leading-[.94] tracking-[-.05em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Los números, más claros para decidir."} /></h2><p className="mt-6 max-w-md text-sm leading-7 text-[#65746a]"><LocalizedText text={"Recreamos la tabla comercial en un formato legible y adaptable. Los escenarios sirven como referencia de conversación, no como garantía de rendimiento."} /></p><div className="mt-8 grid gap-3">{[['60%', 'ocupación estimada'], ['219', 'noches proyectadas'], ['3', 'escenarios de tipología']].map(([value, label]) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-[#d4dfcd] bg-white/70 p-4"><span className="font-serif text-3xl text-[#6d8f3c]">{value}</span><span className="text-xs font-semibold text-[#536359]">{label}</span></div>)}</div></div><div className="overflow-hidden rounded-[2rem] border border-[#d4dfcd] bg-white shadow-[0_24px_60px_rgba(33,65,43,.10)]"><div className="grid grid-cols-[1.2fr_repeat(3,.8fr)] bg-[#21412b] px-4 py-4 text-[10px] font-bold uppercase tracking-[.12em] text-white sm:px-6"><span><LocalizedText text={"Variable"} /></span><span><LocalizedText text={"1 hab."} /></span><span><LocalizedText text={"2 hab."} /></span><span><LocalizedText text={"3 hab."} /></span></div>{rentabilityRows.map(([label, one, two, three], index) => <div key={label} className={`grid grid-cols-[1.2fr_repeat(3,.8fr)] items-center gap-2 border-b border-[#e5ece0] px-4 py-4 text-xs last:border-0 sm:px-6 ${index === rentabilityRows.length - 1 ? 'bg-[#edf5df] font-bold text-[#21412b]' : 'text-[#536359]'}`}><span className="font-semibold">{label}</span><span>{one}</span><span>{two}</span><span>{three}</span></div>)}<p className="border-t border-[#dce5d6] px-4 py-4 text-[10px] leading-5 text-[#7b887e] sm:px-6"><LocalizedText text={"Fuente: tabla comercial entregada para Palm View. Validar supuestos, precios, operación, mantenimiento e impuestos antes de presentar una propuesta."} /></p></div></div></section>
    <section id="acceso" className="bg-[#f7f7f2] px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-start"><div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#6d8f3c]"><LocalizedText text={"Acceso comercial"} /></p><h2 className="mt-5 max-w-md font-serif text-5xl leading-[.94] tracking-[-.05em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Solicita tu acceso broker."} /></h2><p className="mt-6 max-w-md text-sm leading-7 text-[#65746a]"><LocalizedText text={"Déjanos tus datos y el equipo responsable de Palm View te enviará la información para consultar disponibilidad, preparar propuestas y trabajar el proyecto."} /></p></div><LeadCaptureForm projectId={project.id} projectSlug={project.slug} projectName={project.name} typologyOptions={typologyOptions} accentClassName="bg-[#21412b] hover:bg-[#2f5e3b]" initialMessage="Solicito acceso comercial para Palm View." localeOverride="es" /></div></section>
    <section id="administrador-homebelike" className="bg-white px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch"><div className="relative min-h-[28rem] overflow-hidden rounded-[2.5rem] bg-[#dce9c9]"><UITranslationBoundary attributes={["alt"]}><Image src="/projects/palm-view/gallery/amenidades-lobby-central.jpg" alt="Servicio hotelero y recepción para Palm View" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover transition duration-700 hover:scale-[1.03]" /></UITranslationBoundary><div className="absolute inset-0 bg-gradient-to-t from-[#173b25]/65 via-transparent to-transparent" /><span className="absolute bottom-6 left-6 rounded-full border border-white/35 bg-[#173b25]/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-white backdrop-blur"><LocalizedText text={"HMS · Homebelike"} /></span></div><div className="flex flex-col justify-center"><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#6d8f3c]"><LocalizedText text={"Administrador hotelero"} /></p><h2 className="mt-5 max-w-xl font-serif text-5xl leading-[.94] tracking-[-.05em] text-[#24422b] sm:text-6xl"><LocalizedText text={"La operación que convierte una propiedad en experiencia."} /></h2><p className="mt-6 text-base leading-7 text-[#536359]"><LocalizedText text={"Homebelike, plataforma de renta de propiedades a corto plazo de HMS, especializada en Latinoamérica y el Caribe, conecta la operación hotelera con una experiencia de concierge para propietarios y huéspedes."} /></p><div className="mt-8 rounded-2xl border border-[#d4dfcd] bg-[#eef3e7] p-5"><p className="text-xl font-bold text-[#08783f]"><LocalizedText text={"Filosofía R · E · S · T"} /></p><p className="mt-2 text-sm text-[#536359]"><LocalizedText text={"Rentabilidad, Experiencia, Servicio y Transparencia."} /></p></div><div className="mt-8 grid gap-3 sm:grid-cols-2">{[['Canales internacionales', 'Distribución online, canales hoteleros, GDS, agencias y brokers.', 'activity'], ['Concierge y experiencia', 'Servicio cuidado para el huésped y acompañamiento al propietario.', 'concierge'], ['Rentas visibles', 'Consulta reservas, rentas y productividad en línea.', 'access'], ['Operación integral', 'Pricing, limpieza, mantenimiento, personal y seguimiento.', 'service']].map(([title, body, kind]) => <article key={title} className="rounded-2xl border border-[#d4dfcd] bg-white p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef5e4] text-[#08783f]"><AmenityGlyph kind={kind} /></span><h3 className="mt-4 text-sm font-bold text-[#29452f]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#718078]">{body}</p></article>)}</div></div></div></section>
    <style jsx global>{`
      .palm-view-landing { display: flex; flex-direction: column; }
      .palm-view-landing > section { order: 99; }
      .palm-view-landing > footer { order: 999 !important; flex-shrink: 0; }
      .palm-view-landing > section:nth-of-type(1) { order: 1; }
      .palm-view-landing > #concepto { order: 2; }
      .palm-view-landing > section:nth-of-type(3) { order: 3; }
      .palm-view-landing > section:nth-of-type(4) { order: 3.5; }
      .palm-view-landing > #experiencia-visual { order: 4; }
      .palm-view-landing > #galeria { order: 4.5; }
      .palm-view-landing > #tipologias { order: 5; }
      .palm-view-landing > section:nth-of-type(9) { order: 6; }
      .palm-view-landing > section:nth-of-type(10) { order: 7; }
      .palm-view-landing > #acabados { order: 8; }
      .palm-view-landing > #administrador { display: none; }
      .palm-view-landing > #administrador-homebelike { order: 9; }
      .palm-view-landing > #inversion { order: 10; }
      .palm-view-landing > #rentabilidad { order: 11; }
      .palm-view-landing > #disponibilidad { order: 12; }
      .palm-view-landing > #faq { order: 13; }
      .palm-view-landing > section:nth-of-type(15) { order: 14; }
      .palm-view-landing > #acceso { order: 15; }
      .palm-view-landing > #planes, .palm-view-landing > #amenidades { display: none; }
      .palm-view-landing #inicio > div:first-child { position: relative; top: 1.25rem; }
      .palm-view-landing .palm-motion-item { opacity: 0; transform: translateY(24px); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); transition-delay: var(--palm-delay, 0ms); }
      .palm-view-landing .palm-motion-section.is-revealed .palm-motion-item { opacity: 1; transform: translateY(0); }
      .palm-view-landing .palm-motion-section#inicio .palm-motion-item { opacity: 1; transform: none; transition: none; }
      #inversion > figure { min-height: 32rem; background: url('/projects/palm-view/gallery/exteriores-06-palm-view-torres.jpg') center/cover; }
      #inversion > figure > div, #inversion > figure > figcaption { visibility: hidden; }
      @media (min-width: 640px) { .palm-view-landing #inicio > div:first-child { top: 0; } }
      @media (max-width: 639px) { #inversion > figure { min-height: 22rem; } }
    `}</style>
  </>;
}

const faqs = [
  ['¿Qué necesito para reservar?', 'US$2,000 para reservar, completar el formato de reserva, el proceso Conozca su Cliente y la documentación requerida.'],
  ['¿Cómo es la forma de pago?', 'Después de reservar, el cliente tiene 30 días para completar el 20% inicial. El 40% se paga durante la construcción y el 40% restante a la entrega.'],
  ['¿Los apartamentos se entregan amueblados?', 'Sí. El material comercial indica que todos los apartamentos se entregan completamente amueblados, con aire acondicionado y línea blanca.'],
  ['¿Puedo rentar mi apartamento?', 'Sí. El proyecto contempla rentas vacacionales y de larga estadía; algunos modelos permiten configuración Connecting o Lock Off.'],
  ['¿Cuándo se entrega?', 'La disponibilidad se organiza por etapas: Torres 1 y 2 corresponden a la primera etapa y Torre 3 a la segunda etapa. Confirma siempre la fecha en la lista de precios vigente.'],
];

type PalmUnit = {
  stage: 1 | 2;
  stageLabel: string;
  delivery: string;
  tower: string;
  unit: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  view: string;
  price: number | null;
  status: 'available' | 'reserved' | 'sold' | 'blocked';
};

function getDbPalmUnits(project: ProjectSalesLandingProps['project']): PalmUnit[] {
  if (!project.id || !project.units?.length) return [];
  return project.units.filter((unit) => unit.isPublic !== false).map((unit) => {
    const columns = unit.customColumns ?? {};
    const tower = (unit.tower && unit.tower !== 'Sin torre')
      ? unit.tower
      : (columns.Torre ?? columns.Tower ?? columns.Bloque ?? 'Sin torre');
    const stageCol = columns.Etapa ?? columns.Stage ?? '';
    const stageText = `${stageCol} ${tower}`.toLowerCase();
    const stage: 1 | 2 = /segunda|etapa\s*2|torre\s*3/i.test(stageText) ? 2 : 1;
    const normalizedStatus = String(unit.status ?? '').trim().toLowerCase();
    const status = /disponible|available/.test(normalizedStatus) ? 'available' : /separad|reserv|reserved/.test(normalizedStatus) ? 'reserved' : /vendid|sold/.test(normalizedStatus) ? 'sold' : 'blocked';
    
    // Exact bathrooms
    const banCol = Object.entries(columns).find(([k]) => {
      const norm = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes('ban') || norm.includes('bath');
    })?.[1];
    let bathrooms = unit.bathrooms;
    if (banCol) {
      const pBan = parseFloat(String(banCol).replace(',', '.'));
      if (!isNaN(pBan) && pBan > 0) bathrooms = pBan;
    }

    // Exact area
    const areaCol = Object.entries(columns).find(([k]) => {
      const norm = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return (norm.includes('m2') || norm.includes('area') || norm.includes('metraje')) && !norm.includes('terreno') && !norm.includes('patio');
    })?.[1];
    let areaSqm = unit.area;
    if (areaCol) {
      const pArea = parseFloat(String(areaCol).replace(',', '.').replace(/[^\d.]/g, ''));
      if (!isNaN(pArea) && pArea > 0) areaSqm = Math.round(pArea * 100) / 100;
    }

    // Exact view without duplicate Vista
    const viewEntry = Object.entries(columns).find(([k]) => {
      const norm = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes('vista') || norm.includes('view');
    });
    const rawView = viewEntry?.[1] || columns.Vista || columns.View || 'Por confirmar';

    // Type
    const typeEntry = Object.entries(columns).find(([k]) => {
      const norm = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm === 'tipo' || norm === 'type';
    });
    const type = typeEntry?.[1] || unit.type;

    // Strip tower prefix from unit code for display (e.g. "T1-101" → "101")
    const rawUnit = unit.unit;
    const displayUnit = rawUnit.replace(/^[TB]\d+-/i, '');

    return {
      stage,
      stageLabel: stage === 1 ? 'Primera etapa' : 'Segunda etapa',
      delivery: columns.Entrega ?? columns.Delivery ?? project.delivery,
      tower,
      unit: displayUnit,
      type: type.replace(/^Tipo\s+/i, ''),
      bedrooms: unit.bedrooms,
      bathrooms,
      areaSqm,
      view: rawView,
      price: unit.price > 0 ? unit.price : null,
      status,
    };
  });
}

function formatPrice(value: number) {
  return `US$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`;
}

export default function PalmViewProjectLanding({ project, config, isAuthenticated = false, customTypologies }: ProjectSalesLandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [tower, setTower] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState(0);
  const heroHeadline = config?.hero?.headline || 'Donde la vida toma otro ritmo.';
  const heroSubheadline = config?.hero?.subheadline || 'Palm View Golf & Apartments combina apartamentos amueblados, servicios hoteleros y el paisaje de un resort diseñado para quedarse.';
  const heroBadge = config?.hero?.badgeText || 'Punta Cana · Coral Golf Resort';
  const dbUnits = useMemo(() => getDbPalmUnits(project), [project]);
  const units = useMemo(() => dbUnits.length ? dbUnits : (project.isLocalPreview || project.id === 0 ? availability.units as PalmUnit[] : []), [dbUnits, project.id, project.isLocalPreview]);
  const stageTowers = useMemo(() => {
    const stageUnits = units.filter((u) => stage === 0 || u.stage === stage);
    const distinct = Array.from(new Set(stageUnits.map((u) => u.tower).filter((t) => Boolean(t) && t !== 'Sin torre'))).sort();
    return distinct.length > 0 ? ['all', ...distinct] : ['all'];
  }, [units, stage]);
  const liveTypologies = useMemo(() => {
    const uploaded = Object.values(customTypologies ?? {});
    if (uploaded.length) {
      return uploaded.map((item) => ({
        title: item.name,
        specs: `${item.bedrooms} ${item.bedrooms === 1 ? 'habitación' : 'habitaciones'} · ${item.bathrooms} baños`,
        area: item.tagline || `${item.constructionAreaSqm} m²`,
        image: item.image || item.floorPlanImage || null,
      }));
    }
    return fallbackTypologies.map(([title, specs, area, image]) => ({ title, specs, area, image }));
  }, [customTypologies]);
  const galleryImages = useMemo(() => {
    const custom = (project.gallery || []).filter(Boolean);
    return custom.length ? custom : gallery;
  }, [project.gallery]);
  const availableUnits = useMemo(() => units.filter((u) => u.status === 'available' && (stage === 0 || u.stage === stage) && (tower === 'all' || u.tower === tower)), [units, stage, tower]);
  const minPrice = useMemo(() => {
    const availablePrices = units.filter((u) => u.status === 'available' && typeof u.price === 'number' && u.price > 0).map((u) => u.price as number);
    if (availablePrices.length) return Math.min(...availablePrices);
    return project.startingPrice || 0;
  }, [units, project.startingPrice]);
  const inventorySummary = useMemo(() => {
    const officialTotal = 275;
    const imported = units.length;
    const available = units.filter((u) => u.status === 'available').length;
    const reserved = units.filter((u) => u.status === 'reserved').length;
    const sold = units.filter((u) => u.status === 'sold').length;
    const base = officialTotal;
    const availablePercent = Math.round((available / base) * 100);
    const reservedPercent = Math.round((reserved / base) * 100);
    const soldPercent = Math.round((sold / base) * 100);
    const pending = Math.max(0, officialTotal - imported);
    return { officialTotal, imported, available, reserved, sold, availablePercent, reservedPercent, soldPercent, pending };
  }, [units]);

  const sourceLabel = project.inventorySourceLabel || 'Lista oficial de precios Palm View';
  const sourceUpdatedAt = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' }) : 'reciente';

  useEffect(() => {
    const elements = document.querySelectorAll('[data-palm-reveal]');
    const sections = document.querySelectorAll('.palm-view-landing > section');
    const heroElements = document.querySelectorAll('.animate-hero-entry, .animate-hero-entry-d1, .animate-hero-entry-d2, .animate-hero-entry-d3');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((el) => el.classList.add('is-revealed'));
      sections.forEach((sec) => sec.classList.add('is-revealed'));
      heroElements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="palm-view-landing min-h-screen bg-[#f7f7f2] text-[#1b2b20] selection:bg-[#b7cd88] selection:text-[#1b2b20]">
      <header className="fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-6 sm:py-4 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[#d4dfcd] bg-[#f7f7f2] text-[#21412b] px-3 py-3 shadow-[0_14px_35px_rgba(33,65,43,.14)] sm:px-6">
          <a href="#inicio" className="flex items-center gap-3">
            <Image
              src={config?.navbarLogoUrl || '/projects/palm-view/logo-header.png'}
              alt={project.name || 'Palm View'}
              width={56}
              height={56}
              unoptimized
              priority
              className="h-10 w-10 object-contain sm:h-12 sm:w-12 shrink-0"
            />
            {config?.navbarLogoTextUrl ? (
              <Image
                src={config.navbarLogoTextUrl}
                alt={project.name || 'Palm View'}
                width={140}
                height={40}
                unoptimized
                priority
                className="h-8 sm:h-9 w-auto object-contain shrink-0"
              />
            ) : (
              <span className="text-xs sm:text-sm font-bold tracking-[.22em] text-[#21412b] uppercase">
                {project.name ? (project.name.toLowerCase().includes('palm view') ? 'PALM VIEW' : project.name) : 'PALM VIEW'}
              </span>
            )}
          </a>
          <UITranslationBoundary attributes={["aria-label"]}><nav aria-label="Navegación principal" className="hidden items-center gap-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#31583a] xl:flex">
            <a href="#disponibilidad" className="transition hover:text-[#08783f]"><LocalizedText text={"Disponibilidad"} /></a>
            <a href="#galeria" className="transition hover:text-[#08783f]"><LocalizedText text={"Galería"} /></a>
            <a href="#tipologias" className="transition hover:text-[#08783f]"><LocalizedText text={"Tipologías"} /></a>
            <a href="#amenidades" className="transition hover:text-[#08783f]"><LocalizedText text={"Amenidades"} /></a>
            <a href="#rentabilidad" className="transition hover:text-[#08783f]"><LocalizedText text={"Rentabilidad"} /></a>
            <a href="#faq" className="transition hover:text-[#08783f]"><LocalizedText text={"FAQ"} /></a>
          </nav></UITranslationBoundary>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-1.5 rounded-full border border-[#b7caae] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[.08em] text-[#31583a] transition hover:bg-[#eaf2df] sm:inline-flex">
              <ArrowLeft className="h-3.5 w-3.5" /> <span><LocalizedText text={"Volver al portal"} /></span>
            </Link>
            <PublicLanguageSwitcher circular />
            <Link href="/login?next=/preview-palm-view" className="hidden items-center gap-1.5 rounded-full bg-[#dbeabe] px-3 py-2 text-[10px] font-black uppercase tracking-[.08em] text-[#21472b] transition hover:bg-[#c9dfa5] sm:inline-flex">
              <LockKeyhole className="h-3.5 w-3.5" /> <span className="hidden xl:inline"><LocalizedText text={"Acceso brokers"} /></span><span className="xl:hidden"><LocalizedText text={"Brokers"} /></span>
            </Link>
            <UITranslationBoundary attributes={["aria-label"]}><button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Abrir menú"
              className="grid h-10 w-10 place-items-center rounded-full bg-[#e9f1dc] text-[#254b2e] xl:hidden cursor-pointer"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button></UITranslationBoundary>
          </div>
          {menuOpen && (
            <div className="absolute left-3 right-3 top-[calc(100%+10px)] grid max-h-[calc(100vh-90px)] gap-1 overflow-y-auto rounded-3xl border border-[#d4dfcd] bg-[#f7f7f2] p-3 text-sm text-[#31583a] shadow-2xl xl:hidden">
              <a href="#disponibilidad" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 transition hover:bg-[#eaf2df]"><LocalizedText text={"Disponibilidad"} /></a>
              <a href="#galeria" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 transition hover:bg-[#eaf2df]"><LocalizedText text={"Galería"} /></a>
              <a href="#tipologias" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 transition hover:bg-[#eaf2df]"><LocalizedText text={"Tipologías"} /></a>
              <a href="#amenidades" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 transition hover:bg-[#eaf2df]"><LocalizedText text={"Amenidades"} /></a>
              <a href="#rentabilidad" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 transition hover:bg-[#eaf2df]"><LocalizedText text={"Rentabilidad"} /></a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 transition hover:bg-[#eaf2df]"><LocalizedText text={"FAQ"} /></a>
              <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 transition hover:bg-[#eaf2df]"><LocalizedText text={"Volver al portal"} /></Link>
              <Link href="/login?next=/preview-palm-view" onClick={() => setMenuOpen(false)} className="rounded-2xl bg-[#dbeabe] px-4 py-3 font-bold text-[#21472b]"><LocalizedText text={"Acceso brokers"} /></Link>
            </div>
          )}
        </div>
      </header>

      <section className="relative min-h-[760px] overflow-hidden bg-[#213b2a] text-white sm:min-h-[820px]">
        <UITranslationBoundary attributes={["alt"]}><Image src={gallery[0]} alt="Vista aérea de Palm View en Coral Golf Resort" fill priority sizes="100vw" className="object-cover object-center" /></UITranslationBoundary>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,27,17,.82)_0%,rgba(16,42,25,.52)_43%,rgba(15,29,21,.22)_72%,rgba(15,29,21,.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,24,15,.58),rgba(8,24,15,.04)_38%,rgba(8,24,15,.86))]" />
        <div id="inicio" className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl flex-col justify-end px-5 pb-10 sm:min-h-[820px] sm:px-10 sm:pb-14 lg:px-16">
          <div className="max-w-3xl">
            <p className="animate-hero-entry mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.28em] text-[#d7e9b4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c3dd89]" />{heroBadge}
            </p>
            <h1 className="animate-hero-entry-d1 max-w-3xl font-serif text-5xl leading-[.92] tracking-[-.055em] text-white drop-shadow-[0_3px_22px_rgba(0,0,0,.35)] sm:text-7xl lg:text-[7.3rem]">
              {heroHeadline}
            </h1>
            <p className="animate-hero-entry-d2 mt-7 max-w-xl text-base leading-7 text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,.35)] sm:text-lg">
              {heroSubheadline}
            </p>
            <div className="animate-hero-entry-d3 mt-9 flex flex-wrap items-center gap-3">
              <a href="#disponibilidad" className="inline-flex items-center gap-3 rounded-full bg-[#eff5e4] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#22482d] transition hover:-translate-y-0.5 hover:bg-white"><LocalizedText text={"Ver disponibilidad "} /><ArrowUpRight className="h-4 w-4" /></a>
              <a href="#concepto" className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-[#10291a]/20 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"><LocalizedText text={"Explorar Palm View "} /><ArrowDown className="h-4 w-4" /></a>
            </div>
          </div>
          <div className="mt-16 grid max-w-3xl grid-cols-2 gap-4 border-t border-white/25 pt-5 text-sm sm:grid-cols-4"><div><p className="text-2xl font-semibold">{minPrice ? `Desde ${formatPrice(minPrice)}` : <LocalizedText text={"Precio a consultar"} />}</p><p className="mt-1 text-[10px] uppercase tracking-[.16em] text-white/60"><LocalizedText text={"Disponibilidad vigente"} /></p></div><div><p className="text-2xl font-semibold">275</p><p className="mt-1 text-[10px] uppercase tracking-[.16em] text-white/60"><LocalizedText text={"Apartamentos"} /></p></div><div><p className="text-2xl font-semibold">18</p><p className="mt-1 text-[10px] uppercase tracking-[.16em] text-white/60"><LocalizedText text={"Hoyos de golf"} /></p></div><div><p className="text-2xl font-semibold"><LocalizedText text={"2 etapas"} /></p><p className="mt-1 text-[10px] uppercase tracking-[.16em] text-white/60"><LocalizedText text={"Entrega programada"} /></p></div></div>
        </div>
      </section>

      <section id="concepto" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-10 sm:py-32 lg:grid-cols-[.8fr_1.2fr] lg:gap-24 lg:px-16">
        <div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"El concepto"} /></p><h2 className="mt-5 max-w-md font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Una pausa que se vuelve hogar."} /></h2></div>
        <div className="max-w-2xl"><p className="text-xl leading-8 text-[#425347] sm:text-2xl sm:leading-9"><LocalizedText text={"Vivir rodeado de verde, cerca del golf, con el confort y los servicios que hacen fácil disfrutar cada día."} /></p><p className="mt-7 text-sm leading-7 text-[#647268]"><LocalizedText text={"Palm View es un conjunto de apartamentos con servicios hoteleros y amenidades propias dentro de Coral Golf Resort. Una dirección para vivir, rentar y volver a elegir."} /></p><div className="mt-10 grid gap-4 sm:grid-cols-3">{[['01', 'Amueblado', 'Listo para disfrutar desde el primer día.'], ['02', 'Flexible', 'Modelos con opciones Connecting o Lock Off.'], ['03', 'Operado', 'Un administrador hotelero para la operación de rentas.']].map(([number, title, body]) => <div key={number} className="border-t border-[#ccd7c5] pt-4"><span className="text-[10px] font-bold tracking-[.2em] text-[#7c9d4b]">{number}</span><h3 className="mt-4 text-sm font-bold text-[#29452f]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#718078]">{body}</p></div>)}</div></div>
      </section>

      <section className="bg-[#eef3e7] px-5 py-20 sm:px-10 sm:py-28 lg:px-16"><div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"Avance de ventas"} /></p><h2 className="mt-5 max-w-md font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Un proyecto que ya está tomando forma."} /></h2><p className="mt-6 max-w-md text-sm leading-7 text-[#5d6e62]"><LocalizedText text={"Palm View tiene una demanda activa. Consulta el inventario vigente y aprovecha las unidades que todavía están disponibles."} /></p></div><div><UITranslationBoundary attributes={["aria-label"]}><div className="flex h-4 overflow-hidden rounded-full bg-white shadow-inner" aria-label="Proporción de unidades por estado"><span className="bg-[#6b963f]" style={{ width: `${inventorySummary.availablePercent}%` }} title={`${inventorySummary.availablePercent}% disponibles`} /><span className="bg-[#d3a85b]" style={{ width: `${inventorySummary.reservedPercent}%` }} title={`${inventorySummary.reservedPercent}% separadas`} /><span className="bg-[#21412b]" style={{ width: `${inventorySummary.soldPercent}%` }} title={`${inventorySummary.soldPercent}% vendidas`} /></div></UITranslationBoundary><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#5d6e62]"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#6b963f]" /><LocalizedText text={" Disponibles "} />{inventorySummary.availablePercent}%</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#d3a85b]" /><LocalizedText text={" Separadas "} />{inventorySummary.reservedPercent}%</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#21412b]" /><LocalizedText text={" Vendidas "} />{inventorySummary.soldPercent}%</span></div></div></div><div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-[#21412b] p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#bad784]"><LocalizedText text={"Total del proyecto"} /></p><p className="mt-4 font-serif text-4xl">{inventorySummary.officialTotal}</p><p className="mt-2 text-xs text-white/60"><LocalizedText text={"apartamentos oficiales"} /></p></div><div className="rounded-2xl border border-[#cadabd] bg-white/65 p-5 text-[#24422b]"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6b963f]"><LocalizedText text={" Disponibles "} /></p><p className="mt-4 font-serif text-4xl">{inventorySummary.available}</p><p className="mt-2 text-xs text-[#6b756b]">{inventorySummary.availablePercent}<LocalizedText text={"% del total"} /></p></div><div className="rounded-2xl border border-[#cadabd] bg-white/65 p-5 text-[#24422b]"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a17d37]"><LocalizedText text={" Separadas "} /></p><p className="mt-4 font-serif text-4xl">{inventorySummary.reserved}</p><p className="mt-2 text-xs text-[#6b756b]">{inventorySummary.reservedPercent}<LocalizedText text={"% del total"} /></p></div><div className="rounded-2xl border border-[#cadabd] bg-white/65 p-5 text-[#24422b]"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#21412b]"><LocalizedText text={" Vendidas "} /></p><p className="mt-4 font-serif text-4xl">{inventorySummary.sold}</p><p className="mt-2 text-xs text-[#6b756b]">{inventorySummary.soldPercent}<LocalizedText text={"% del total"} /></p></div></div>{inventorySummary.pending > 0 && <p className="mt-5 text-[11px] leading-5 text-[#718078]"><LocalizedText text={"La lista de precios importada contiene "} />{inventorySummary.imported}<LocalizedText text={" unidades con estado. "} />{inventorySummary.pending}<LocalizedText text={" unidad queda pendiente de confirmación en la fuente oficial para completar el total de "} />{inventorySummary.officialTotal}<LocalizedText text={" apartamentos."} /></p>}<p className="mt-5 text-[10px] uppercase tracking-[.14em] text-[#718078]"><LocalizedText text={"Corte de disponibilidad: "} />{sourceUpdatedAt}<LocalizedText text={" · Precios y estados sujetos a confirmación comercial."} /></p></div></section>

      <section id="disponibilidad" className="bg-[#21412b] px-5 py-24 text-white sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#bad784]"><LocalizedText text={"Disponibilidad viva"} /></p><h2 className="mt-5 max-w-xl font-serif text-5xl leading-[.95] tracking-[-.045em] sm:text-6xl"><LocalizedText text={"Elige cómo quieres vivirlo."} /></h2><p className="mt-6 max-w-xl text-sm leading-6 text-white/65"><LocalizedText text={"Inventario cargado desde la fuente comercial del "} />{sourceUpdatedAt}<LocalizedText text={". Cada fila conserva su etapa, torre, tipo, área, precio y estado de origen."} /></p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setStage(0); setTower('all'); }} className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${stage === 0 ? 'bg-[#e5f0d0] text-[#21412b]' : 'border border-white/20 text-white/70 hover:bg-white/10'}`}><LocalizedText text={"Todas las etapas"} /></button><button type="button" onClick={() => { setStage(1); setTower('all'); }} className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${stage === 1 ? 'bg-[#e5f0d0] text-[#21412b]' : 'border border-white/20 text-white/70 hover:bg-white/10'}`}><LocalizedText text={"Primera etapa"} /></button><button type="button" onClick={() => { setStage(2); setTower('all'); }} className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${stage === 2 ? 'bg-[#e5f0d0] text-[#21412b]' : 'border border-white/20 text-white/70 hover:bg-white/10'}`}><LocalizedText text={"Segunda etapa"} /></button></div></div><div className="mt-12 flex flex-wrap gap-2 border-b border-white/15 pb-4">{stageTowers.map((item) => <button key={item} type="button" onClick={() => setTower(item)} className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[.15em] transition ${tower === item ? 'bg-white text-[#21412b]' : 'text-white/60 hover:text-white'}`}>{item === 'all' ? 'Todas las torres' : item}</button>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{availableUnits.map((unit) => { const displayView = unit.view ? (unit.view.toLowerCase().startsWith('vista') ? unit.view : `Vista ${unit.view}`) : 'Vista al entorno'; return <article key={`${unit.tower}-${unit.unit}`} className="rounded-2xl border border-white/12 bg-white/[.07] p-5 transition hover:bg-white/[.12]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#bad784]">{unit.tower && unit.tower !== 'Sin torre' ? `${unit.tower} · ` : ''}<LocalizedText text={"Apto "} />{unit.unit}</p><h3 className="mt-2 text-lg font-semibold"><LocalizedText text={"Tipo "} />{unit.type} · {unit.bedrooms}<LocalizedText text={" hab."} /></h3></div><span className="rounded-full bg-[#bad784]/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#d9efad]"><LocalizedText text={"Disponible"} /></span></div><div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs text-white/60"><span>{unit.areaSqm}<LocalizedText text={" m²"} /></span><span>{unit.bathrooms} {unit.bathrooms === 1 ? <LocalizedText text={"baño"} /> : <LocalizedText text={"baños"} />}</span><span className="col-span-2 text-white/45">{displayView}</span></div><p className="mt-5 text-xl font-semibold">{unit.price ? formatPrice(unit.price) : 'Consultar'}</p></article>; })}</div>{availableUnits.length === 0 && <div className="rounded-2xl border border-white/15 p-8 text-sm text-white/65"><LocalizedText text={"No hay unidades disponibles con ese filtro. Solicita la lista actualizada al equipo comercial."} /></div>}<p className="mt-6 text-[11px] leading-5 text-white/45"><LocalizedText text={"Fuente: "} />{sourceLabel}<LocalizedText text={". Los precios, disponibilidad y condiciones están sujetos a confirmación."} /></p></div></section>

      <section id="planes" className="bg-[#e9efdf] px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"El lugar y el proyecto"} /></p><h2 className="mt-5 font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Un master plan que conecta con todo."} /></h2><p className="mt-6 text-sm leading-7 text-[#5f7064]"><LocalizedText text={"Palm View vive dentro de Coral Golf Resort: una comunidad de golf, naturaleza, lagos y experiencias. Su master plan organiza las torres, las amenidades propias y los recorridos del proyecto."} /></p></div><div className="mt-12 grid gap-5 lg:grid-cols-2"><figure className="overflow-hidden rounded-[2rem] border border-[#d0ddc7] bg-white/60 p-3"><div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#dce9c9]"><UITranslationBoundary attributes={["alt"]}><Image src="/projects/palm-view/plans/coral-golf-resort-3d.png" alt="Plano 3D del Coral Golf Resort" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-2" /></UITranslationBoundary></div><figcaption className="px-3 pb-2 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d8f3c]"><LocalizedText text={"Coral Golf Resort"} /></p><p className="mt-2 font-serif text-2xl text-[#29452f]"><LocalizedText text={"Golf, lagos, club de playa y naturaleza."} /></p></figcaption></figure><figure className="overflow-hidden rounded-[2rem] border border-[#d0ddc7] bg-white/60 p-3"><div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-white"><UITranslationBoundary attributes={["alt"]}><Image src="/projects/palm-view/plans/palm-view-master-plan-3d.png" alt="Master plan 3D de Palm View" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-2" /></UITranslationBoundary></div><figcaption className="px-3 pb-2 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d8f3c]"><LocalizedText text={"Palm View"} /></p><p className="mt-2 font-serif text-2xl text-[#29452f]"><LocalizedText text={"Torres, piscinas, senderos y servicios."} /></p></figcaption></figure></div></div></section>

      <section id="tipologias" className="mx-auto max-w-7xl px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"Tipologías"} /></p><h2 className="mt-5 max-w-2xl font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Elige el tipo que se adapta a tu ritmo."} /></h2></div><p className="max-w-sm text-xs leading-6 text-[#718078]"><LocalizedText text={"Información tomada de las tipologías cargadas para este proyecto. Las imágenes pendientes se pueden completar desde el editor de landing."} /></p></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{liveTypologies.map(({ title, specs, area, image }) => { const label = String(title); return <article key={label} className="overflow-hidden rounded-2xl border border-[#d6e0d0] bg-white"><div className="relative aspect-[4/3] bg-[#edf3e7]">{image ? <Image src={image} alt={`${label} Palm View`} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-contain p-3" /> : <div className="grid h-full place-items-center p-5 text-center text-xs font-semibold uppercase tracking-[.16em] text-[#9aae8d]"><LocalizedText text={"Imagen pendiente"} /></div>}</div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6d8f3c]">{label}</p><p className="mt-3 text-sm font-semibold text-[#29452f]">{specs}</p><p className="mt-2 text-xs text-[#718078]">{area}</p></div></article>; })}</div></section>

      <section id="amenidades" className="bg-[#f7f7f2] px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"La experiencia"} /></p><h2 className="mt-5 font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Dos mundos de amenidades, una sola forma de vivir."} /></h2><p className="mt-7 text-sm leading-7 text-[#65746a]"><LocalizedText text={"Palm View forma parte del Coral Golf Resort y suma sus propias comodidades residenciales. Cada grupo está presentado con su identidad y servicios reales."} /></p></div><div className="mt-16 grid gap-16 lg:grid-cols-2"><div><div className="mb-8 flex items-end justify-between gap-5 border-b border-[#ccd7c5] pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6d8f3c]"><LocalizedText text={"Coral Golf Resort"} /></p><h3 className="mt-3 font-serif text-3xl text-[#24422b]"><LocalizedText text={"El entorno que lo hace diferente."} /></h3></div><span className="text-4xl font-serif text-[#cad9bb]">08</span></div><div className="grid gap-3 sm:grid-cols-2">{resortAmenities.map(([title, body, kind]) => <article key={title} className="rounded-2xl border border-[#d6e0d0] bg-white/60 p-4 transition hover:-translate-y-1 hover:bg-white"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5efd9] text-[#08783f]"><AmenityGlyph kind={kind} /></div><h4 className="mt-4 text-sm font-semibold text-[#29452f]">{title}</h4><p className="mt-2 text-xs leading-5 text-[#718078]">{body}</p></article>)}</div></div><div><div className="mb-8 flex items-end justify-between gap-5 border-b border-[#ccd7c5] pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6d8f3c]"><LocalizedText text={"Palm View"} /></p><h3 className="mt-3 font-serif text-3xl text-[#24422b]"><LocalizedText text={"Comodidades para quedarse."} /></h3></div><span className="text-4xl font-serif text-[#cad9bb]">10</span></div><div className="grid gap-3 sm:grid-cols-2">{projectAmenities.map(([title, body, kind]) => <article key={title} className="rounded-2xl border border-[#d6e0d0] bg-white/60 p-4 transition hover:-translate-y-1 hover:bg-white"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5efd9] text-[#08783f]"><AmenityGlyph kind={kind} /></div><h4 className="mt-4 text-sm font-semibold text-[#29452f]">{title}</h4><p className="mt-2 text-xs leading-5 text-[#718078]">{body}</p></article>)}</div></div></div></div></section>

      <section className="bg-[#e9efdf] px-5 py-24 sm:px-10 lg:px-16"><div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-12"><div className="relative min-h-[380px] overflow-hidden rounded-[2rem] sm:col-span-5"><UITranslationBoundary attributes={["alt"]}><Image src={gallery[5]} alt="Interior amueblado de Palm View" fill sizes="(max-width: 640px) 100vw, 42vw" className="object-cover" /></UITranslationBoundary></div><div className="flex flex-col justify-center sm:col-span-7 sm:pl-10"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"Hecho para habitar"} /></p><h2 className="mt-5 max-w-xl font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Un apartamento que ya entiende tu ritmo."} /></h2><div className="mt-8 grid gap-3 sm:grid-cols-2">{['Aire acondicionado', 'Apartamento amueblado', 'Línea blanca incluida', 'Un parqueo asignado', 'Dos ascensores por torre', 'Seguridad privada 24 horas'].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-[#536359]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#c9dca7] text-[#315e37]"><Check className="h-3.5 w-3.5" /></span>{item}</div>)}</div></div></div></section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-10 sm:py-32 lg:grid-cols-[.8fr_1.2fr] lg:px-16"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"Reserva y pagos"} /></p><h2 className="mt-5 font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Una estructura clara para decidir."} /></h2></div><div className="grid gap-4 sm:grid-cols-2">{[['Reserva', 'US$2,000', 'Asegura la unidad e inicia la documentación.'], ['Inicial', '20%', 'A completar dentro de los 30 días posteriores a la reserva.'], ['Construcción', '40%', 'Pagos durante el proceso de construcción.'], ['Entrega', '40%', 'Saldo restante al recibir el proyecto.']].map(([title, value, body]) => <div key={title} className="rounded-2xl border border-[#d4dfcd] bg-white/60 p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7b9c4c]">{title}</p><p className="mt-5 font-serif text-4xl text-[#29452f]">{value}</p><p className="mt-3 text-xs leading-5 text-[#718078]">{body}</p></div>)}</div></section>

      <section id="administrador" className="bg-[#eef3e7] px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"Operación hotelera"} /></p><h2 className="mt-5 max-w-md font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Vive tu unidad. Deja que la operación trabaje."} /></h2><p className="mt-7 max-w-md text-sm leading-7 text-[#5d6e62]"><LocalizedText text={"Homebelike, administrador hotelero de HMS, opera las rentas de corta estadía con una mirada regional, servicio de concierge y seguimiento transparente para propietarios."} /></p><p className="mt-5 text-xs leading-6 text-[#718078]"><LocalizedText text={"El propietario puede reservar su unidad y consultar en línea sus rentas y productividad. La operación, canales y condiciones finales deben confirmarse con el administrador."} /></p></div><div className="grid gap-3 sm:grid-cols-2">{[['Estrategia de renta', 'Distribución en canales online, hoteleros y agencias para equilibrar ocupación y precio.', 'spark'], ['Experiencia del huésped', 'Estándar hotelero, limpieza, desinfección y atención de incidencias.', 'concierge'], ['Administración integral', 'Presupuesto, personal, mantenimiento, cuentas y coordinación operativa.', 'service'], ['Visibilidad para el propietario', 'Consulta de reservas, rentas y productividad mediante herramientas digitales.', 'access']].map(([title, body, kind]) => <article key={title} className="rounded-2xl border border-[#d2dec9] bg-white/70 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dcebc8] text-[#08783f]"><AmenityGlyph kind={kind} /></div><h3 className="mt-5 text-sm font-semibold text-[#29452f]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#718078]">{body}</p></article>)}</div></div></section>

      <section id="inversion" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-10 sm:py-32 lg:grid-cols-[1.05fr_.95fr] lg:px-16"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"Por qué invertir"} /></p><h2 className="mt-5 max-w-xl font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Una inversión respaldada por destino, operación y visión."} /></h2><div className="mt-10 grid gap-3 sm:grid-cols-2">{[['15 años', 'Beneficios fiscales de CONFOTUR, sujetos a la documentación y condiciones aplicables.', 'spark'], ['3% + 1%', 'Exención indicada para impuesto de transferencia e IPI anual durante 15 años.', 'access'], ['Rentas', 'Gestión y administración hotelera para apoyar el desempeño de la unidad.', 'hotel'], ['Asesoría', 'Acompañamiento fiscal, tributario y de residencia para el inversionista.', 'service'], ['Ubicación', 'Punta Cana dentro de Coral Golf Resort, con golf, playa y servicios.', 'nature'], ['Transparencia', 'Consulta las condiciones comerciales y la disponibilidad vigente antes de reservar.', 'meeting']].map(([title, body, kind]) => <article key={title} className="rounded-2xl border border-[#d4dfcd] bg-white/55 p-5"><div className="flex items-center gap-3"><span className="text-[#08783f]"><AmenityGlyph kind={kind} /></span><h3 className="text-sm font-semibold text-[#29452f]">{title}</h3></div><p className="mt-3 text-xs leading-5 text-[#718078]">{body}</p></article>)}</div><p className="mt-6 text-[10px] leading-5 text-[#7b887e]"><LocalizedText text={"Los beneficios fiscales, proyecciones y condiciones de operación están sujetos a aprobación, legislación vigente y documentación oficial del proyecto."} /></p></div><figure className="overflow-hidden rounded-[2rem] border border-[#d4dfcd] bg-[#edf3e7] p-3"><div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-white"><UITranslationBoundary attributes={["alt"]}><Image src="/projects/palm-view/rentability-table.jpg" alt="Tabla de rentabilidad comercial de Palm View" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-contain" /></UITranslationBoundary></div><figcaption className="px-3 pb-2 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d8f3c]"><LocalizedText text={"Rentabilidad comercial"} /></p><p className="mt-2 font-serif text-2xl text-[#29452f]"><LocalizedText text={"Una referencia para conversar con el inversionista."} /></p><p className="mt-2 text-xs leading-5 text-[#718078]"><LocalizedText text={"La tabla es material comercial de referencia; valida supuestos, fechas y valores antes de incorporarlos en una propuesta."} /></p></figcaption></figure></section>

      <section id="acabados" className="bg-[#21412b] px-5 py-24 text-white sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto max-w-7xl"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#bad784]"><LocalizedText text={"Manual de acabados"} /></p><h2 className="mt-5 max-w-2xl font-serif text-5xl leading-[.95] tracking-[-.045em] sm:text-6xl"><LocalizedText text={"Materiales pensados para durar y sentirse bien."} /></h2><p className="mt-6 max-w-2xl text-sm leading-7 text-white/60"><LocalizedText text={"Una selección contemporánea de superficies, carpintería y detalles que acompaña el carácter natural de Palm View."} /></p><div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Cocina', 'Muebles RH Capuchino, topes Quartzone o piedra sinterizada y extractor de acero inoxidable según tipología.', 'home'], ['Baños', 'Mampara de vidrio templado claro de 8 mm, porcelanato, espejo y mueble con topes Quartzone.', 'wellness'], ['Habitaciones', 'Clósets RH Capuchino, muros blancos, ventanas de aluminio negro y porcelanato Oxford.', 'access'], ['Sala-comedor', 'Cielo raso en drywall, puerta corrediza de aluminio negro con vidrio laminado y porcelanato Oxford.', 'spark']].map(([title, body, kind]) => <article key={title} className="rounded-2xl border border-white/15 bg-white/[.07] p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#bad784]/15 text-[#d7e9b4]"><AmenityGlyph kind={kind} /></div><h3 className="mt-5 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/60">{body}</p></article>)}</div></div></section>

      <section id="faq" className="bg-[#21412b] px-5 py-24 text-white sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#bad784]"><LocalizedText text={"Preguntas frecuentes"} /></p><h2 className="mt-5 max-w-md font-serif text-5xl leading-[.95] tracking-[-.045em] sm:text-6xl"><LocalizedText text={"Lo importante, sin rodeos."} /></h2><p className="mt-7 max-w-sm text-sm leading-6 text-white/60"><LocalizedText text={"Respuestas tomadas del material comercial entregado para Palm View. Confirma condiciones antes de reservar."} /></p></div><div className="divide-y divide-white/15">{faqs.map(([question, answer], index) => <div key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left text-base font-semibold"><span>{question}</span><ChevronDown className={`h-4 w-4 shrink-0 text-[#bad784] transition ${openFaq === index ? 'rotate-180' : ''}`} /></button>{openFaq === index && <p className="max-w-2xl pb-6 pr-10 text-sm leading-6 text-white/60">{answer}</p>}</div>)}</div></div></section>

      <section className="relative overflow-hidden bg-[#dce9c9] px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><UITranslationBoundary attributes={["alt"]}><Image src={gallery[7]} alt="Paseo exterior de Palm View" fill sizes="100vw" className="object-cover opacity-20" /></UITranslationBoundary><div className="absolute inset-0 bg-[#edf4dc]/65" /><div className="relative mx-auto max-w-7xl rounded-[2rem] border border-white/60 bg-white/35 px-5 py-10 text-center shadow-[0_20px_70px_rgba(33,65,43,.12)] backdrop-blur-[2px] sm:px-10 sm:py-14"><UITranslationBoundary attributes={["alt"]}><Image src="/projects/palm-view/logo.svg" alt="Palm View Golf & Apartments" width={320} height={180} className="mx-auto h-28 w-auto drop-shadow-[0_4px_12px_rgba(255,255,255,.85)]" /></UITranslationBoundary><h2 className="mx-auto mt-8 max-w-3xl font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#173b25] sm:text-7xl"><LocalizedText text={"Tu próxima forma de vivir empieza aquí."} /></h2><p className="mx-auto mt-6 max-w-lg text-sm leading-6 text-[#3c5b43]"><LocalizedText text={"Accede al inventario vigente, prepara propuestas y solicita tus credenciales comerciales para Palm View."} /></p><div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="#acceso" className="inline-flex items-center gap-3 rounded-full bg-[#21412b] px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:bg-[#2f5e3b]"><LocalizedText text={"Solicitar acceso broker "} /><ArrowUpRight className="h-4 w-4" /></Link>{isAuthenticated && <Link href="/portal/proposals/new?project=palm-view" className="inline-flex items-center gap-3 rounded-full border border-[#21412b]/25 px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-[#21412b] transition hover:bg-white/40"><LocalizedText text={"Crear propuesta "} /><ArrowUpRight className="h-4 w-4" /></Link>}</div></div></section>

      <PalmViewExperienceShowcase project={project} typologyOptions={liveTypologies.map((item) => String(item.title))} />
      <footer className="bg-[#14291b] px-5 py-14 text-white sm:px-10 sm:py-16 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[1.1fr_.7fr_.7fr_1.2fr] md:gap-12">
            <div>
              <UITranslationBoundary attributes={["alt"]}><Image src="/projects/palm-view/logo-header.png" alt="Palm View Golf & Apartments" width={72} height={72} className="h-14 w-14 object-contain" /></UITranslationBoundary>
              <p className="mt-5 max-w-xs font-serif text-3xl leading-none text-[#dbeabe]"><LocalizedText text={"Donde la vida toma otro ritmo."} /></p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/55"><LocalizedText text={"Palm View Golf & Apartments dentro de Coral Golf Resort, Punta Cana."} /></p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#bad784]"><LocalizedText text={"Explorar"} /></p>
              <div className="mt-5 grid gap-3 text-sm text-white/65">
                <a href="#disponibilidad" className="transition hover:text-white"><LocalizedText text={"Disponibilidad"} /></a>
                <a href="#tipologias" className="transition hover:text-white"><LocalizedText text={"Tipologías"} /></a>
                <a href="#amenidades" className="transition hover:text-white"><LocalizedText text={"Amenidades"} /></a>
                <a href="#rentabilidad" className="transition hover:text-white"><LocalizedText text={"Rentabilidad"} /></a>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#bad784]"><LocalizedText text={"Área broker"} /></p>
              <div className="mt-5 grid gap-3 text-sm text-white/65">
                <a href="#acceso" className="transition hover:text-white"><LocalizedText text={"Solicitar acceso"} /></a>
                <Link href="/login?next=/preview-palm-view" className="transition hover:text-white"><LocalizedText text={"Acceso brokers"} /></Link>
                <a href="#faq" className="transition hover:text-white"><LocalizedText text={"Preguntas frecuentes"} /></a>
                <Link href="/" className="transition hover:text-white"><LocalizedText text={"Volver al portal"} /></Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#bad784]"><LocalizedText text={"Información legal"} /></p>
              <div className="mt-5 grid gap-3 text-sm text-white/65">
                <Link href="/legal#disclaimer" className="transition hover:text-white"><LocalizedText text={"Disclaimer y responsabilidad"} /></Link>
                <Link href="/legal#privacidad" className="transition hover:text-white"><LocalizedText text={"Política de privacidad"} /></Link>
                <Link href="/legal#cookies" className="transition hover:text-white"><LocalizedText text={"Política de cookies"} /></Link>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[.14em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()}<LocalizedText text={" osvaldobello.com · OB Brokers Team. Todos los derechos reservados."} /></span>
            <span className="flex items-center gap-2"><MapPin className="h-3 w-3" /><LocalizedText text={" Punta Cana, República Dominicana"} /></span>
          </div>
        </div>
      </footer>
      <section id="galeria" className="bg-[#f7f7f2] px-5 py-24 sm:px-10 sm:py-32 lg:px-16"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-8 border-b border-[#dce5d6] pb-8 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#6d8f3c]"><LocalizedText text={"Archivo Palm View"} /></p><h2 className="mt-5 max-w-2xl font-serif text-5xl leading-[.95] tracking-[-.045em] text-[#24422b] sm:text-6xl"><LocalizedText text={"Una galería para entrar en el ritmo."} /></h2><p className="mt-5 max-w-xl text-sm leading-6 text-[#65746a]"><LocalizedText text={"Renders, exteriores y amenidades seleccionados para presentar Palm View con claridad. Las imágenes de tipologías permanecen en su sección propia."} /></p></div><BrandedGalleryDownload projectId={project.id} projectName={project.name} images={galleryImages} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#21412b] px-5 py-3 text-[10px] font-black uppercase tracking-[.14em] text-white transition hover:bg-[#315e3b] disabled:cursor-not-allowed disabled:opacity-60" /></div><div className="mt-10 grid gap-4 sm:grid-cols-12">{galleryImages.slice(0, 8).map((image, index) => <figure key={`${image}-${index}`} className={`${index === 0 ? 'sm:col-span-7 sm:row-span-2 sm:min-h-[31rem]' : 'sm:col-span-5'} group relative min-h-[14rem] overflow-hidden rounded-[1.75rem] border border-[#dce5d6] bg-[#e9efdf]`}><Image src={image} alt={`Palm View · imagen ${index + 1}`} fill sizes={index === 0 ? '(max-width: 640px) 100vw, 58vw' : '(max-width: 640px) 100vw, 42vw'} className="object-cover transition duration-700 group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-t from-[#173b25]/55 via-transparent to-transparent opacity-80" /><figcaption className="absolute bottom-4 left-4 rounded-full border border-white/25 bg-[#173b25]/55 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-white backdrop-blur">{index === 0 ? 'Palm View' : `Vista ${String(index + 1).padStart(2, '0')}`}</figcaption></figure>)}</div></div></section>
    </main>
  );
}
