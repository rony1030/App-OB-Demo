'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useState, useMemo, useRef } from 'react';
import Image from '@/components/ui/OptimizedImage';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Maximize2, Check, ShieldCheck, Trees, Sun, Waves, Car, Heart, Flame, Flower2, Compass, Activity, ArrowLeft, ArrowRight, ArrowUpRight, LockKeyhole, X, Users, CheckCircle2, SlidersHorizontal, Bed, Bath } from 'lucide-react';
import type { ProjectSalesLandingProps } from '@/components/landing/ProjectSalesLanding';
import LeadCaptureForm from '@/components/landing/LeadCaptureForm';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { formatCurrency } from '@/lib/utils';

interface UnitDetails {
  unit_code: string;
  lot_sqm: number;
  construction_sqm: number;
  habitable_sqm: number;
  terrace_sqm: number;
  parking_sqm: number;
  base_price: number;
  deluxe_price: number;
  royal_price: number;
  status: string;
}

const isUnitAvailable = (status: string) => ['available', 'disponible'].includes(status.trim().toLowerCase());
const isUnitSold = (status: string) => ['sold', 'vendida', 'vendido'].includes(status.trim().toLowerCase());
const isUnitReserved = (status: string) => ['reserved', 'separated', 'reservada', 'separada'].includes(status.trim().toLowerCase());

const DEFAULT_UNITS: UnitDetails[] = [
  { unit_code: '01', lot_sqm: 176.47, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 97000, deluxe_price: 112000, royal_price: 127000, status: 'available' },
  { unit_code: '02', lot_sqm: 169.58, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 98500, deluxe_price: 113500, royal_price: 128500, status: 'available' },
  { unit_code: '03', lot_sqm: 167.61, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 98000, deluxe_price: 113000, royal_price: 128000, status: 'available' },
  { unit_code: '04', lot_sqm: 171.79, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 99000, deluxe_price: 114000, royal_price: 129000, status: 'available' },
  { unit_code: '05', lot_sqm: 182.40, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 102000, deluxe_price: 117000, royal_price: 132000, status: 'available' },
  { unit_code: '06', lot_sqm: 206.30, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 104000, deluxe_price: 119000, royal_price: 134000, status: 'available' },
  { unit_code: '07', lot_sqm: 215.76, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 103500, deluxe_price: 118500, royal_price: 133500, status: 'available' },
  { unit_code: '08', lot_sqm: 165.50, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 108000, deluxe_price: 123000, royal_price: 138000, status: 'available' },
  { unit_code: '09', lot_sqm: 138.60, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 95000, deluxe_price: 110000, royal_price: 125000, status: 'available' },
  { unit_code: '10', lot_sqm: 138.58, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 95000, deluxe_price: 110000, royal_price: 125000, status: 'available' },
  { unit_code: '11', lot_sqm: 194.21, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 104999, deluxe_price: 119999, royal_price: 134999, status: 'available' },
  { unit_code: '12', lot_sqm: 165.45, construction_sqm: 67.5, habitable_sqm: 35, terrace_sqm: 20, parking_sqm: 12.5, base_price: 104500, deluxe_price: 119500, royal_price: 134500, status: 'available' },
];

const SHOWCASE_ITEMS = [
  {
    category: 'exteriores',
    title: 'Fachada Principal & Entrada',
    desc: 'Arquitectura biofílica contemporánea con piedra local, madera tratada y vegetación autóctona.',
    image: '/images/projects/elements/exterior.jpg',
  },
  {
    category: 'exteriores',
    title: 'Entorno Biofílico & Privacidad',
    desc: 'Integración paisajística donde cada villa goza de ventilación natural y aislamiento acústico orgánico.',
    image: '/images/projects/elements/ext-2.jpg',
  },
  {
    category: 'eco-suite',
    title: 'Terraza Privada & Deck Apergolado',
    desc: 'Espacio exterior de 20 m² con deck en madera y preinstalación para picuzzi opcional.',
    image: '/images/projects/elements/elements-3.jpg',
  },
  {
    category: 'exteriores',
    title: 'Complejo Residencial & Áreas Verdes',
    desc: 'Distribución perimetral de baja densidad: solo 12 unidades con senderos ecológicos.',
    image: '/images/projects/elements/elements-5.jpg',
  },
  {
    category: 'eco-suite',
    title: 'Sala & Comedor Integrados',
    desc: 'Interiores luminosos con techos altos y ventanales que diluyen el límite entre interior y exterior.',
    image: '/images/projects/elements/sala-comedor.jpg',
  },
  {
    category: 'eco-suite',
    title: 'Suite Principal de Lujo Orgánico',
    desc: 'Dormitorio master con vistas al jardín privado, texturas cálidas y climatización de alta eficiencia.',
    image: '/images/projects/elements/hab-2.jpg',
  },
  {
    category: 'eco-suite',
    title: 'Baño de Estilo Spa Cenital',
    desc: 'Materiales nobles, ducha con entrada de luz natural y griferías de bajo consumo hídrico.',
    image: '/images/projects/elements/bano-2.jpg',
  },
  {
    category: 'areas',
    title: 'Garita de Acceso & Seguridad',
    desc: 'Control perimetral inteligente y seguridad las 24 horas para total tranquilidad.',
    image: '/images/projects/elements/garita.jpg',
  },
  {
    category: 'planos',
    title: 'Master Plan 3D Elements',
    desc: 'Visualización tridimensional de la implantación arquitectónica sobre el terreno de Nisibón.',
    image: '/images/projects/elements/master-plan-3d.jpg',
  },
  {
    category: 'planos',
    title: 'Plano Isométrico 3D Eco Suite',
    desc: 'Distribución espacial detallada de los 67.50 m²: interior 35 m², terraza 20 m² y parqueo 12.50 m².',
    image: '/images/projects/elements/plano-tipologia-3d.jpg',
  },
  {
    category: 'planos',
    title: 'Master Plan 2D & Solares',
    desc: 'Plano técnico con la numeración de los solares individuales desde 138 m² hasta 215 m².',
    image: '/images/projects/elements/master-plan-2d.jpg',
  },
];

const AMENITIES = [
  { icon: ShieldCheck, title: 'Seguridad 24/7', desc: 'Control de acceso vigilado y garita perimetral con circuito cerrado' },
  { icon: Trees, title: 'Senderos Ecológicos', desc: 'Caminerías inmersas en flora autóctona y áreas protegidas' },
  { icon: Flower2, title: 'Jardín Biofílico', desc: 'Diseño paisajístico de bajo consumo hídrico y especies endémicas' },
  { icon: Flame, title: 'Área Social & BBQ', desc: 'Zona de esparcimiento comunitaria para residentes y propietarios' },
  { icon: Compass, title: 'Playas Vírgenes', desc: 'A solo minutos del litoral virgen e inexplorado de Nisibón' },
  { icon: Sun, title: 'Sustentabilidad', desc: 'Preinstalación para energía solar y diseño eco-eficiente pasivo' },
  { icon: Car, title: 'Parqueo Asignado', desc: 'Estacionamiento privado de 12.50 m² frente a cada Eco Suite' },
  { icon: Activity, title: 'Yoga & Bienestar', desc: 'Espacios al aire libre diseñados para relajación, meditación y fitness' },
  { icon: Heart, title: 'Comunidad Pet Friendly', desc: 'Entorno abierto y seguro para disfrutar con mascotas' },
  { icon: Waves, title: 'Picuzzi Privado', desc: 'Incluido en el equipamiento Eco Royal' },
];

// ─── Animation Variants ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay } },
});

// Helper component for scroll-triggered sections
function FadeSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ElementsProjectLanding({
  project,
}: ProjectSalesLandingProps) {
  const { locale } = useLocale();
  const tText = (es: string, en: string, fr?: string) => {
    if (locale === 'fr') return fr || en;
    if (locale === 'en') return en;
    return es;
  };

  const getShowcaseText = (title: string, desc: string) => {
    if (locale === 'es') return { title, desc };
    const map: Record<string, { title: [string, string]; desc: [string, string] }> = {
      'Fachada Principal & Entrada': {
        title: ['Main Facade & Entrance', 'Façade Principale & Entrée'],
        desc: ['Contemporary biophilic architecture with local stone, treated wood, and indigenous flora.', 'Architecture biophilique contemporaine avec pierre locale, bois traité et flore indigène.'],
      },
      'Entorno Biofílico & Privacidad': {
        title: ['Biophilic Setting & Privacy', 'Cadre Biophilique & Intimité'],
        desc: ['Landscape integration where every villa enjoys natural cross-ventilation and organic acoustic privacy.', 'Intégration paysagère où chaque villa bénéficie d’une aération naturelle et d’une intimité phonique organique.'],
      },
      'Terraza Privada & Deck Apergolado': {
        title: ['Private Terrace & Pergola Deck', 'Terrasse Privative & Deck Pergola'],
        desc: ['20 sqm outdoor wooden deck area with pre-installation for an optional private picuzzi.', 'Espace extérieur de 20 m² en bois avec pré-installation pour un picuzzi privé en option.'],
      },
      'Complejo Residencial & Áreas Verdes': {
        title: ['Residential Community & Green Areas', 'Complexe Résidentiel & Espaces Verts'],
        desc: ['Low-density perimeter layout: only 12 detached units surrounded by ecological trails.', 'Implantation périphérique à faible densité : seulement 12 unités entourées de sentiers écologiques.'],
      },
      'Sala & Comedor Integrados': {
        title: ['Integrated Living & Dining', 'Salon & Salle à Manger Intégrés'],
        desc: ['Bright interiors with high ceilings and glass doors dissolving the barrier between indoors and outdoors.', 'Intérieurs lumineux avec hauts plafonds et baies vitrées effaçant la limite intérieur/extérieur.'],
      },
      'Suite Principal de Lujo Orgánico': {
        title: ['Organic Luxury Master Suite', 'Suite Parentale de Luxe Organique'],
        desc: ['Master bedroom overlooking private garden, warm natural textures, and high-efficiency climate control.', 'Chambre principale avec vue sur le jardin privé, textures chaleureuses et climatisation éco-efficace.'],
      },
      'Baño de Estilo Spa Cenital': {
        title: ['Zenithal Spa-Style Bathroom', 'Salle de Bain Style Spa Zénithale'],
        desc: ['Noble natural materials, rain shower illuminated by natural skylight, and low-flow fixtures.', 'Matériaux nobles, douche avec puits de lumière naturelle et robinetterie éco-responsable.'],
      },
      'Garita de Acceso & Seguridad': {
        title: ['Access Guardhouse & Security', 'Poste de Garde & Sécurité'],
        desc: ['Smart perimeter access control and 24-hour monitored security for total peace of mind.', 'Contrôle d’accès intelligent et sécurité 24h/24 pour une sérénité totale.'],
      },
      'Master Plan 3D Elements': {
        title: ['Elements 3D Master Plan', 'Plan Masse 3D Elements'],
        desc: ['3D architectural visualization of the master layout situated on the Nisibón land.', 'Visualisation tridimensionnelle de l’implantation architecturale sur le site de Nisibón.'],
      },
      'Plano Isométrico 3D Eco Suite': {
        title: ['3D Isometric Plan Eco Suite', 'Plan Isométrique 3D Éco Suite'],
        desc: ['Detailed space breakdown of 67.50 sqm: 35 sqm interior, 20 sqm deck, and 12.50 sqm parking.', 'Répartition spatiale détaillée des 67,50 m² : 35 m² intérieurs, 20 m² terrasse et 12,50 m² stationnement.'],
      },
      'Master Plan 2D & Solares': {
        title: ['2D Master Plan & Lots', 'Plan Masse 2D & Terrains'],
        desc: ['Technical surveyed layout showing individual lot dimensions from 138 sqm to 215 sqm.', 'Plan technique avec numérotation des terrains individuels de 138 m² à 215 m².'],
      },
    };
    const entry = map[title];
    if (!entry) return { title, desc };
    const idx = locale === 'fr' ? 1 : 0;
    return { title: entry.title[idx], desc: entry.desc[idx] };
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedPackage, setSelectedPackage] = useState<'base' | 'deluxe' | 'royal'>('base');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Contact Modal State (for all Apartar / Contactar buttons)
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [modalTargetUnit, setModalTargetUnit] = useState<string | null>(null);

  const handleOpenContact = (unitCode?: string) => {
    setModalTargetUnit(unitCode || null);
    setContactModalOpen(true);
  };


  // Normalize a unit code: strip leading '1' prefix from 3-digit codes (e.g. '101' → '01')
  const normalizeUnitCode = (raw: string): string => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1 && n <= 12) return String(n).padStart(2, '0');
    // 3-digit codes like '101'–'112': strip leading '1' → '01'–'12'
    if (raw.length === 3 && raw.startsWith('1')) {
      const tail = raw.slice(1); // '01'–'12'
      const tailN = parseInt(tail, 10);
      if (!isNaN(tailN) && tailN >= 1 && tailN <= 12) return tail;
    }
    return raw;
  };

  // Use catalog units for availability; reference values only fill missing unit details.
  const unitsData: UnitDetails[] = useMemo(() => {
    if (project.units && project.units.length > 0) {
      return project.units.map((u) => {
        const normalizedCode = normalizeUnitCode(u.unit);
        const defaultRef = DEFAULT_UNITS.find((d) => d.unit_code === normalizedCode);
        const custom = (u.customColumns || {}) as Record<string, unknown>;

        let customParsed: Record<string, unknown> = {};
        if (typeof u.notes === 'string' && u.notes.trim().startsWith('{')) {
          try {
            customParsed = JSON.parse(u.notes);
          } catch {}
        }

        const base = Number(
          custom.base_price ||
          customParsed.base_price ||
          (u.price && u.price !== defaultRef?.deluxe_price && u.price !== defaultRef?.royal_price ? u.price : null) ||
          defaultRef?.base_price ||
          u.price ||
          95000
        );
        const lotSqm = Number(
          custom.lot_sqm ||
          customParsed.lot_sqm ||
          defaultRef?.lot_sqm ||
          152.04
        );
        const deluxePrice = Number(
          custom.deluxe_price ||
          customParsed.deluxe_price ||
          defaultRef?.deluxe_price ||
          base + 15000
        );
        const royalPrice = Number(
          custom.royal_price ||
          customParsed.royal_price ||
          defaultRef?.royal_price ||
          base + 30000
        );

        return {
          unit_code: normalizedCode,
          lot_sqm: lotSqm,
          construction_sqm: Number(custom.construction_sqm || customParsed.construction_sqm || defaultRef?.construction_sqm || 67.5),
          habitable_sqm: Number(custom.habitable_sqm || customParsed.habitable_sqm || defaultRef?.habitable_sqm || 35.0),
          terrace_sqm: Number(custom.terrace_sqm || customParsed.terrace_sqm || defaultRef?.terrace_sqm || 20.0),
          parking_sqm: Number(custom.parking_sqm || customParsed.parking_sqm || defaultRef?.parking_sqm || 12.5),
          base_price: base,
          deluxe_price: deluxePrice,
          royal_price: royalPrice,
          status: u.status || 'unknown',
        };
      });
    }
    return [];
  }, [project.units]);

  const availableUnits = unitsData.filter((unit) => isUnitAvailable(unit.status));
  const availableBasePrices = availableUnits.map((unit) => unit.base_price).filter((price) => Number.isFinite(price) && price > 0);
  const minimumBasePrice = availableBasePrices.length ? Math.min(...availableBasePrices) : null;
  const maximumBasePrice = availableBasePrices.length ? Math.max(...availableBasePrices) : null;

  const filteredShowcase = useMemo(() => {
    if (selectedCategory === 'todos') return SHOWCASE_ITEMS;
    return SHOWCASE_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans selection:bg-[#B89368] selection:text-white antialiased overflow-x-hidden">
      {/* VISTAL NAVBAR: PERMANENTLY FIXED & ALWAYS VISIBLE */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#FAF8F5]/95 border-b border-stone-200/80 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 lg:h-24 flex items-center justify-between">
          {/* Brand Logo - Enlarged for desktop and crisp on mobile */}
          <Link href="/proyectos/elements" className="flex items-center gap-3">
            <div className="relative h-12 w-48 sm:h-14 sm:w-60 lg:h-16 lg:w-72 xl:h-18 xl:w-80">
              <UITranslationBoundary attributes={["alt"]}><Image
                src="/images/projects/elements/logo-horizontal.png"
                alt="Elements Residences & Resort"
                fill
                sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 360px"
                className="object-contain object-left"
                priority
              /></UITranslationBoundary>
            </div>
          </Link>

          {/* Desktop Navigation Links — simplified */}
          <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-[0.16em] text-stone-600 font-medium">
            <a href="#concepto" className="hover:text-stone-950 transition-colors">{tText('Concepto', 'Concept', 'Concept')}</a>
            <a href="#disponibilidad" className="hover:text-stone-950 transition-colors">{tText('Disponibilidad', 'Availability', 'Disponibilité')}</a>
            <a href="#galeria" className="hover:text-stone-950 transition-colors">{tText('Galería', 'Gallery', 'Galerie')}</a>
            <a href="#planes-pago" className="hover:text-stone-950 transition-colors">{tText('Finanzas', 'Finances', 'Finances')}</a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop: Back to portal + Language switcher + Brokers access */}
            <div className="hidden lg:flex items-center gap-2.5">
              <Link
                href="/proyectos"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#b7caae] bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.08em] text-[#31583a] transition hover:bg-[#eaf2df] shadow-2xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{tText('Volver al portal', 'Back to portal', 'Retour au portail')}</span>
              </Link>

              <PublicLanguageSwitcher circular />

              <Link
                href="/login?next=/proyectos/elements"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#dbeabe] px-3.5 py-2 text-[11px] font-black uppercase tracking-[.08em] text-[#21472b] transition hover:bg-[#c9dfa5] shadow-2xs"
              >
                <LockKeyhole className="h-3.5 w-3.5" />
                <span>{tText('Acceso brokers', 'Brokers access', 'Accès brokers')}</span>
              </Link>
            </div>

            {/* Mobile: Back button or Language switcher + hamburger */}
            <div className="lg:hidden flex items-center gap-2">
              <Link
                href="/proyectos"
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#b7caae] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#31583a] transition hover:bg-[#eaf2df]"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>{tText('Volver', 'Back', 'Retour')}</span>
              </Link>
              <PublicLanguageSwitcher circular />
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full border border-stone-300 flex flex-col items-center justify-center gap-1.5 bg-white shadow-xs"
              aria-label={tText('Abrir menú', 'Open menu', 'Ouvrir le menu')}
            >
              <span className={`w-4 h-0.5 bg-stone-900 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-4 h-0.5 bg-stone-900 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-4 h-0.5 bg-stone-900 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* MOBILE MENU DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-stone-200 bg-[#FAF8F5] px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-3 text-sm uppercase tracking-wider text-stone-800 font-medium">
              <a
                href="#concepto"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200/60"
              >
                {tText('Concepto', 'Concept', 'Concept')}
              </a>
              <a
                href="#paquetes"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200/60"
              >
                {tText('Paquetes & Opciones', 'Packages & Options', 'Forfaits & Options')}
              </a>
              <a
                href="#eco-suite"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200/60"
              >
                {tText('La Eco Suite 3D', 'The 3D Eco Suite', "L'Éco Suite 3D")}
              </a>
              <a
                href="#disponibilidad"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200/60"
              >
                {tText('Disponibilidad Oficial', 'Official Availability', 'Disponibilité Officielle')}
              </a>
              <a
                href="#galeria"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200/60"
              >
                {tText('Galería de Renders', 'Render Gallery', 'Galerie de rendus')}
              </a>
              <a
                href="#planes-pago"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200/60"
              >
                {tText('Plan de Pagos', 'Payment Plan', 'Plan de paiement')}
              </a>
            </nav>

            {/* Action buttons inside mobile menu */}
            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/proyectos"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-[#b7caae] bg-white text-[#31583a] text-xs font-bold tracking-wider uppercase hover:bg-[#eaf2df] transition-all shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{tText('Volver al portal', 'Back to portal', 'Retour au portail')}</span>
              </Link>
              <Link
                href="/login?next=/proyectos/elements"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#dbeabe] text-[#21472b] text-xs font-black tracking-wider uppercase hover:bg-[#c9dfa5] transition-all shadow-xs"
              >
                <LockKeyhole className="w-4 h-4" />
                <span>{tText('Acceso brokers', 'Brokers access', 'Accès brokers')}</span>
              </Link>
            </div>
          </div>
        )}
      </header>
      {/* Fixed header spacer */}
      <div className="h-20 lg:h-24 shrink-0" aria-hidden="true" />

      {/* VISTAL HERO SECTION */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 px-5 sm:px-8 border-b border-stone-200 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto">
          {/* Animated Header + Title */}
          <motion.div
            className="max-w-4xl"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.div variants={stagger(0)} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-300 shadow-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#B89368]" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-stone-700 font-semibold">
                {tText('Santuario Residencial Biofílico · Nisibón', 'Biophilic Residential Sanctuary · Nisibón', 'Sanctuaire Résidentiel Biophilique · Nisibón')}
              </span>
            </motion.div>

            <motion.h1 variants={stagger(0.08)} className="text-3xl sm:text-5xl lg:text-6xl font-serif text-stone-900 tracking-tight leading-[1.12]">
              {tText('Vive en armonía con la naturaleza virgen del Caribe.', 'Live in harmony with the pristine Caribbean nature.', 'Vivez en harmonie avec la nature vierge des Caraïbes.')}
            </motion.h1>

            <motion.p variants={stagger(0.16)} className="mt-5 text-stone-600 text-sm sm:text-base lg:text-lg font-light leading-relaxed max-w-2xl">
              {tText(
                'Colección boutique de solo 12 Eco Suites independientes con solares privados de hasta 215 m². Arquitectura orgánica, alta rentabilidad turística y desconexión total a minutos de Macao y Uvero Alto.',
                'Boutique collection of only 12 detached Eco Suites with private lots of up to 215 sqm. Organic architecture, high rental yields, and complete disconnect minutes from Macao and Uvero Alto.',
                'Collection boutique de seulement 12 Éco Suites indépendantes avec terrains privés jusqu’à 215 m². Architecture organique, haute rentabilité locative et déconnexion totale à quelques minutes de Macao et Uvero Alto.'
              )}
            </motion.p>

            {/* Vistal Style Dual Action Buttons */}
            <motion.div variants={stagger(0.24)} className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#disponibilidad"
                className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-stone-900 text-white text-xs font-semibold tracking-wider uppercase hover:bg-stone-800 transition-all shadow-md"
              >
                <span>{tText('Ver Disponibilidad & Precios', 'View Availability & Prices', 'Voir Disponibilités & Prix')}</span>
                <div className="w-8 h-8 rounded-full bg-white text-stone-900 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </a>

              <a
                href="#paquetes"
                className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-white border border-stone-300 text-stone-800 text-xs font-semibold tracking-wider uppercase hover:bg-stone-50 transition-all shadow-xs"
              >
                <span>{tText('Comparar Paquetes', 'Compare Packages', 'Comparer les Forfaits')}</span>
                <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </a>
            </motion.div>
          </motion.div>

          {/* Large Hero Render Frame — scales in on load */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 rounded-3xl overflow-hidden border border-stone-200/90 shadow-xl bg-white relative aspect-[16/9] sm:aspect-[21/9] max-h-[560px]"
          >
            <UITranslationBoundary attributes={["alt"]}><Image
              src="/images/projects/elements/exterior.jpg"
              alt="Elements Residences Exterior y Fachada"
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            /></UITranslationBoundary>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-stone-200/80 text-xs text-stone-800 shadow-sm font-medium">
              {tText('Render Oficial · Fachada Principal y Entorno Natural', 'Official Render · Main Facade & Natural Setting', 'Rendu Officiel · Façade Principale et Cadre Naturel')}
            </div>
          </motion.div>

          {/* Key Metrics Grid — staggered reveal */}
          <motion.div
            className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } } }}
          >
            {[
              {
                label: tText('Colección Limitada', 'Limited Collection', 'Collection Limitée'),
                value: tText('12 Suites', '12 Suites', '12 Suites'),
                sub: tText('Solares de 138 a 215 m²', 'Lots from 138 to 215 m²', 'Terrains de 138 à 215 m²'),
                accent: false,
              },
              {
                label: tText('Precio Inicial', 'Starting Price', 'Prix de Départ'),
                value: minimumBasePrice === null ? tText('A consultar', 'On request', 'Sur demande') : formatCurrency(minimumBasePrice),
                sub: tText('Aparta con solo US $500', 'Reserve with only US $500', 'Réservez avec seulement 500 $US'),
                accent: true,
              },
              {
                label: tText('Metraje Construido', 'Built Area', 'Surface Construite'),
                value: '67.50 m²',
                sub: tText('35m² int + 20m² deck + parqueo', '35m² int + 20m² deck + parking', '35m² int + 20m² terrasse + parking'),
                accent: false,
              },
            ].map((m) => (
              <motion.div
                key={m.label}
                variants={stagger(0)}
                whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs cursor-default"
              >
                <span className={`text-[10px] uppercase tracking-[0.2em] font-semibold block ${m.accent ? 'text-[#B89368]' : 'text-stone-500'}`}>{m.label}</span>
                <span className="text-2xl sm:text-3xl font-serif text-stone-900 mt-1 block">{m.value}</span>
                <span className={`text-xs mt-0.5 block ${m.accent ? 'text-emerald-600 font-medium' : 'text-stone-500'}`}>{m.sub}</span>
              </motion.div>
            ))}
            <motion.div
              variants={stagger(0)}
              whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between cursor-default"
            >
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold block">
                  {tText('Entrega Estimada', 'Estimated Delivery', 'Livraison Estimée')}
                </span>
                <span className="text-xl sm:text-2xl font-serif text-stone-900 mt-1 block">
                  {tText('Diciembre 2027', 'December 2027', 'Décembre 2027')}
                </span>
              </div>
              <a
                href="#disponibilidad"
                className="inline-flex items-center gap-1.5 text-xs text-[#B89368] hover:text-[#8A663E] font-medium mt-2 group"
              >
                <span>{tText('Consultar disponibilidad', 'Check availability', 'Consulter la disponibilité')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MANIFIESTO / ABOUT ELEMENTS SECTION */}
      <section id="concepto" className="py-20 lg:py-28 px-5 sm:px-8 border-b border-stone-200 bg-[#F5F2EB]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column sticky */}
            <FadeSection className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 text-[11px] font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89368]" />
                {tText('Manifiesto Arquitectónico', 'Architectural Manifesto', 'Manifeste Architectural')}
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif text-stone-900 leading-tight">
                {tText('Lujo Orgánico & Conexión Biofílica.', 'Organic Luxury & Biophilic Connection.', 'Luxe Organique & Connexion Biophilique.')}
              </h2>

              <p className="text-stone-600 text-sm leading-relaxed">
                {tText(
                  'Elements surge como una respuesta honesta al turismo masivo tradicional. Ubicado en Nisibón, La Altagracia, este santuario residencial redefine el concepto de segunda vivienda caribeña a través de edificaciones de bajo impacto, materiales autóctonos y jardines endémicos.',
                  'Elements emerges as an honest response to traditional mass tourism. Located in Nisibón, La Altagracia, this residential sanctuary redefines the Caribbean vacation home through low-impact architecture, native materials, and endemic gardens.',
                  'Elements naît comme une réponse sincère au tourisme de masse traditionnel. Situé à Nisibón, La Altagracia, ce sanctuaire résidentiel redéfinit la résidence secondaire caribéenne grâce à des constructions à faible impact, des matériaux autochtones et des jardins endémiques.'
                )}
              </p>

              <motion.div
                whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-stone-200 flex items-center justify-center text-[#B89368] shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif text-stone-900 font-semibold">
                      {tText('Comunidad Exclusiva & Privada', 'Exclusive & Private Community', 'Communauté Exclusive & Privée')}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {tText('Solo 12 propietarios compartirán este ecosistema cerrado.', 'Only 12 owners will share this gated eco-haven.', 'Seulement 12 propriétaires partageront cet écosystème fermé.')}
                    </p>
                  </div>
                </div>
              </motion.div>
            </FadeSection>

            {/* Right Column: Numbered Cards with scroll-stagger */}
            <motion.div
              className="lg:col-span-7 space-y-4 sm:space-y-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={{ show: { transition: { staggerChildren: 0.15 } } }}
            >
              {[
                {
                  num: '01',
                  title: tText('Arquitectura Biofílica & Sostenibilidad', 'Biophilic Architecture & Sustainability', 'Architecture Biophilique & Durabilité'),
                  body: tText(
                    'Ventilación cruzada pasiva, techos apergolados con filtro térmico y texturas en maderas certificadas que reducen la huella ambiental e incrementan el confort térmico.',
                    'Passive cross ventilation, pergolas with thermal screening, and certified wood textures that minimize ecological footprint while enhancing thermal comfort.',
                    'Ventilation croisée passive, toits à pergolas avec filtre thermique et textures en bois certifié réduisant l’empreinte écologique et maximisant le confort thermique.'
                  ),
                },
                {
                  num: '02',
                  title: tText('Solar Propio & Privacidad Individual', 'Private Lot & Individual Privacy', 'Terrain Privé & Intimité Individuelle'),
                  body: tText(
                    'A diferencia de los condominios tradicionales en torre, en Elements adquieres tu propio solar independiente de hasta 215.76 m² con amplia terraza apergolada y patio privado.',
                    'Unlike standard high-rise condos, at Elements you acquire your own detached lot of up to 215.76 sqm with an expansive covered pergola terrace and private yard.',
                    'Contrairement aux copropriétés en tour, vous acquérez à Elements votre propre terrain indépendant jusqu’à 215,76 m² avec vaste terrasse à pergola et jardin privatif.'
                  ),
                },
                {
                  num: '03',
                  title: tText('Personalización de Paquetes: Base, Deluxe y Royal', 'Package Customization: Base, Deluxe & Royal', 'Personnalisation des Forfaits : Base, Deluxe et Royal'),
                  body: tText(
                    'El precio base incluye la Eco Suite con su solar. Eco Deluxe añade mobiliario y línea blanca; Eco Royal incorpora además picuzzi y paneles solares.',
                    'The base price includes the Eco Suite and its lot. Eco Deluxe adds furnishings and appliances; Eco Royal also includes a picuzzi and solar panels.',
                    'Le prix de base inclut l’Éco Suite avec son terrain. Eco Deluxe ajoute le mobilier et l’électroménager ; Eco Royal comprend aussi un picuzzi et des panneaux solaires.'
                  ),
                },
                {
                  num: '04',
                  title: tText('Ubicación Estratégica & Desconexión en Nisibón', 'Strategic Location & Serene Retreat in Nisibón', 'Emplacement Stratégique & Déconnexion à Nisibón'),
                  body: tText(
                    'A solo 20 minutos de Macao y 30 minutos de Uvero Alto. Lejos del ruido y la saturación hotelera, con acceso expedito a playas vírgenes y reservas naturales del Este.',
                    'Just 20 minutes from Macao and 30 minutes from Uvero Alto. Away from hotel density and noise, with prompt access to untouched beaches and eastern nature reserves.',
                    'À 20 minutes de Macao et 30 minutes d’Uvero Alto. Loin de la saturation hôtelière, avec un accès rapide aux plages vierges et aux réserves naturelles de l’Est.'
                  ),
                },
              ].map((pillar) => (
                <motion.div
                  key={pillar.num}
                  variants={fadeUp}
                  whileHover={{ x: 6, borderColor: '#B89368', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
                  className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 shadow-xs transition-colors duration-300"
                >
                  <div className="flex items-start gap-5 sm:gap-6">
                    <span className="font-serif text-2xl sm:text-3xl text-stone-300 font-light shrink-0">
                      {pillar.num}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-serif text-stone-900 font-semibold">
                        {pillar.title}
                      </h3>
                      <p className="mt-2 text-stone-600 text-xs sm:text-sm leading-relaxed">
                        {pillar.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* PACKAGES COMPARISON (BASE vs DELUXE vs ROYAL) */}
      <section id="paquetes" className="py-20 lg:py-28 px-5 sm:px-8 border-b border-stone-200 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 text-[11px] font-semibold tracking-wider uppercase mb-3">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B89368]" />
              {tText('Equipamiento & Opciones', 'Equipment & Options', 'Équipements & Options')}
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif text-stone-900">
              {tText('Elige tu nivel de confort y rentabilidad.', 'Choose your level of comfort and yield.', 'Choisissez votre niveau de confort et rentabilité.')}
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              {tText(
                'Eco Deluxe incluye mobiliario y línea blanca. Eco Royal suma picuzzi integrado y paneles solares a la unidad amueblada.',
                'Eco Deluxe includes furnishings and appliances. Eco Royal adds an integrated picuzzi and solar panels to the furnished unit.',
                'Eco Deluxe comprend le mobilier et l’électroménager. Eco Royal ajoute un picuzzi intégré et des panneaux solaires à l’unité meublée.'
              )}
            </p>
          </FadeSection>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ show: { transition: { staggerChildren: 0.15 } } }}
          >
            {/* PAQUETE BASE */}
            <motion.div variants={fadeUp} className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between relative">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stone-500">
                  {tText('Opción 01', 'Option 01', 'Option 01')}
                </div>
                <h3 className="text-xl font-serif text-stone-900 mt-1 font-semibold">
                  {tText('Paquete Base', 'Base Package', 'Forfait Base')}
                </h3>
                <div className="mt-4 pb-4 border-b border-stone-100">
                  <span className="text-2xl sm:text-3xl font-serif text-stone-900 block font-semibold">
                    {minimumBasePrice === null || maximumBasePrice === null
                      ? tText('Consultar disponibilidad', 'Check availability', 'Consulter les disponibilités')
                      : minimumBasePrice === maximumBasePrice
                        ? formatCurrency(minimumBasePrice)
                        : `${formatCurrency(minimumBasePrice)} – ${formatCurrency(maximumBasePrice)}`}
                  </span>
                  <span className="text-xs text-stone-500 mt-0.5 block">
                    {tText('Según el metraje del solar asignado', 'Depending on the assigned lot size', 'Selon la surface du terrain attribué')}
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-stone-600">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tText('Solar individual privado de', 'Private individual lot of', 'Terrain privatif individuel de')} <strong>138 {tText('a', 'to', 'à')}<LocalizedText text={" 200 m²"} /></strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong><LocalizedText text={"67.50 m² "} />{tText('construidos:', 'built:', 'construits :')}</strong> {tText('35 m² interiores + 20 m² terraza apergolada + 12.50 m² parqueo', '35 sqm interior + 20 sqm pergola deck + 12.50 sqm parking', '35 m² intérieurs + 20 m² terrasse à pergola + 12,50 m² parking')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tText('Dormitorio master con baño tipo spa integrado', 'Master bedroom with en-suite spa-inspired bathroom', 'Chambre principale avec salle de bain spa intégrée')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tText('Sala, cocina y comedor con ventanales de piso a techo', 'Living, kitchen, and dining with floor-to-ceiling glass doors', 'Salon, cuisine et salle à manger avec baies vitrées toute hauteur')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tText('Preinstalación eléctrica para climatización y paneles', 'Pre-installation for A/C and solar panels', 'Pré-équipement électrique pour climatisation et panneaux')}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-stone-400">
                    <X className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
                    <span>{tText('Picuzzi no incluido (solo en Eco Royal)', 'Picuzzi not included (Eco Royal only)', 'Picuzzi non inclus (Eco Royal uniquement)')}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-stone-400">
                    <X className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
                    <span>{tText('Mobiliario y línea blanca no incluidos', 'Furnishings and appliances not included', 'Mobilier et électroménager non inclus')}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackage('base');
                    document.getElementById('disponibilidad')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full min-h-[46px] px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center text-center ${
                    selectedPackage === 'base'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                  }`}
                >
                  {selectedPackage === 'base'
                    ? tText('Seleccionado Actualmente', 'Currently Selected', 'Actuellement Sélectionné')
                    : tText('Ver Precios Base', 'View Base Prices', 'Voir les Prix Base')}
                </button>
              </div>
            </motion.div>

            {/* PAQUETE DELUXE */}
            <motion.div variants={fadeUp} className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#B89368] shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#B89368] text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm">
                {tText('Equipamiento completo', 'Fully equipped', 'Entièrement équipé')}
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#B89368]">
                  {tText('Opción 02 · Upgrade', 'Option 02 · Upgrade', 'Option 02 · Surclassement')}
                </div>
                <h3 className="text-xl font-serif text-stone-900 mt-1 font-semibold">
                  {tText('Paquete Deluxe', 'Deluxe Package', 'Forfait Deluxe')}
                </h3>
                <div className="mt-4 pb-4 border-b border-stone-100">
                  <span className="text-2xl sm:text-3xl font-serif text-stone-900 block font-semibold">
                    {tText('Base + US $15,000', 'Base + US $15,000', 'Base + 15 000 $US')}
                  </span>
                  <span className="text-xs text-[#B89368] font-medium mt-0.5 block">
                    {tText('Desde US $110,000 · amueblado y equipado', 'From US $110,000 · furnished and equipped', 'Dès 110 000 $US · meublé et équipé')}
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-stone-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B89368] shrink-0 mt-0.5" />
                    <span><strong>{tText('Todo lo incluido en el Paquete Base', 'Everything in the Base Package included', 'Tout ce qui est inclus dans le Forfait Base')}</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B89368] shrink-0 mt-0.5" />
                    <span><strong>{tText('Mobiliario de alta gama', 'High-end furnishings', 'Mobilier haut de gamme')}</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B89368] shrink-0 mt-0.5" />
                    <span>{tText('Línea blanca completa: estufa, extractor y aires acondicionados', 'Full appliances: stove, extractor hood, and air conditioning', 'Électroménager complet : cuisinière, hotte et climatisation')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B89368] shrink-0 mt-0.5" />
                    <span>{tText('Deck de observación, sistemas de bajo consumo y acabados de lujo', 'Observation deck, low-consumption systems, and luxury finishes', 'Deck d’observation, systèmes basse consommation et finitions haut de gamme')}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-stone-400">
                    <X className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
                    <span>{tText('Picuzzi y paneles solares corresponden a Eco Royal', 'Picuzzi and solar panels belong to Eco Royal', 'Le picuzzi et les panneaux solaires sont réservés à Eco Royal')}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackage('deluxe');
                    document.getElementById('disponibilidad')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full min-h-[46px] px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center text-center ${
                    selectedPackage === 'deluxe'
                      ? 'bg-[#B89368] text-white shadow-xs'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  {selectedPackage === 'deluxe'
                    ? tText('Seleccionado Actualmente', 'Currently Selected', 'Actuellement Sélectionné')
                    : tText('Ver Precios Deluxe', 'View Deluxe Prices', 'Voir les Prix Deluxe')}
                </button>
              </div>
            </motion.div>

            {/* PAQUETE ROYAL */}
            <motion.div variants={fadeUp} className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between relative">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stone-500">
                  {tText('Opción 03 · Llave en Mano', 'Option 03 · Turnkey', 'Option 03 · Clé en Main')}
                </div>
                <h3 className="text-xl font-serif text-stone-900 mt-1 font-semibold">
                  {tText('Paquete Royal', 'Royal Package', 'Forfait Royal')}
                </h3>
                <div className="mt-4 pb-4 border-b border-stone-100">
                  <span className="text-2xl sm:text-3xl font-serif text-stone-900 block font-semibold">
                    {tText('Base + US $30,000', 'Base + US $30,000', 'Base + 30 000 $US')}
                  </span>
                  <span className="text-xs text-stone-500 mt-0.5 block">
                    {tText('Desde US $125,000 · picuzzi y energía solar', 'From US $125,000 · picuzzi and solar power', 'Dès 125 000 $US · picuzzi et énergie solaire')}
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-stone-600">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{tText('Unidad amueblada y equipada', 'Furnished and equipped unit', 'Unité meublée et équipée')}</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{tText('Mobiliario biofílico completo:', 'Full biophilic furnishings:', 'Mobilier biophilique complet :')}</strong> {tText('Cama Queen con cabecero en madera noble, sofá, comedor, mesas de noche', 'Queen bed with hardwood headboard, sofa, dining set, nightstands', 'Lit Queen avec tête de lit en bois noble, canapé, table à manger, tables de chevet')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{tText('Picuzzi integrado', 'Integrated picuzzi', 'Picuzzi intégré')}</strong> {tText('para una experiencia de spa privado', 'for a private spa experience', 'pour une expérience de spa privée')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{tText('Paneles solares', 'Solar panels', 'Panneaux solaires')}</strong> {tText('para energía independiente', 'for independent power', 'pour une alimentation autonome')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tText('Terraza de madera premium', 'Premium wooden terrace', 'Terrasse en bois haut de gamme')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tText('Lista para habitar o rentar', 'Ready to live in or rent', 'Prête à habiter ou à louer')}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackage('royal');
                    document.getElementById('disponibilidad')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full min-h-[46px] px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center text-center ${
                    selectedPackage === 'royal'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                  }`}
                >
                  {selectedPackage === 'royal'
                    ? tText('Seleccionado Actualmente', 'Currently Selected', 'Actuellement Sélectionné')
                    : tText('Ver Precios Royal', 'View Royal Prices', 'Voir les Prix Royal')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LIVE AVAILABILITY & LOTS SECTION (NO WHATSAPP BUTTONS, OPEN FORM MODAL) */}
      <section id="disponibilidad" className="py-20 lg:py-28 px-5 sm:px-8 border-b border-stone-200 bg-[#F5F2EB]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 text-[11px] font-semibold tracking-wider uppercase mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {tText('Disponibilidad Oficial en Vivo', 'Live Official Availability', 'Disponibilité Officielle en Direct')}
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif text-stone-900 font-semibold">
                {tText('Inventario Oficial & Solares', 'Official Inventory & Lots', 'Inventaire Officiel & Terrains')}
              </h2>
              <p className="mt-2 text-stone-600 text-xs sm:text-sm max-w-xl leading-relaxed">
                {tText(
                  `${availableUnits.length} de ${unitsData.length} solares disponibles para reserva con US$ 500. Selecciona el paquete para consultar el precio exacto de cada lote.`,
                  `${availableUnits.length} of ${unitsData.length} lots available to reserve with US$ 500. Select a package to see the exact price of each lot.`,
                  `${availableUnits.length} terrains disponibles sur ${unitsData.length}, avec une réservation de 500 $US. Sélectionnez un forfait pour consulter le prix exact de chaque terrain.`
                )}
              </p>
            </div>

            {/* Interactive Package Switcher */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl sm:rounded-full bg-white border border-stone-300 shadow-xs">
              <span className="text-xs text-stone-500 px-3 uppercase tracking-wider font-semibold">
                {tText('Ver precios:', 'View prices:', 'Voir les prix :')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPackage('base')}
                className={`px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                  selectedPackage === 'base'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tText('Base', 'Base', 'Base')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackage('deluxe')}
                className={`px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                  selectedPackage === 'deluxe'
                    ? 'bg-[#B89368] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tText('Deluxe equipado (+15k)', 'Equipped Deluxe (+15k)', 'Deluxe équipé (+15k)')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackage('royal')}
                className={`px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                  selectedPackage === 'royal'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tText('Royal Llave en Mano (+30k)', 'Royal Turnkey (+30k)', 'Royal Clé en Main (+30k)')}
              </button>
            </div>
          </div>

          {/* Master Plan 3D Preview Banner */}
          <div className="mb-8 rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm relative bg-stone-50">
            <div className="relative w-full" style={{ minHeight: '300px', maxHeight: '480px', aspectRatio: '21/9' }}>
              <UITranslationBoundary attributes={["alt"]}><Image
                src="/images/projects/elements/master-plan-3d.jpg"
                alt="Master Plan 3D Elements Residences"
                fill
                sizes="100vw"
                className="object-cover sm:object-contain object-center cursor-pointer"
                onClick={() => setLightboxImage('/images/projects/elements/master-plan-3d.jpg')}
              /></UITranslationBoundary>
            </div>
            <button
              type="button"
              onClick={() => setLightboxImage('/images/projects/elements/master-plan-3d.jpg')}
              className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-xs text-stone-800 border border-stone-200 shadow-sm flex items-center gap-2 hover:bg-white cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#B89368]" />
              <span>{tText('Ampliar Master Plan 3D de Solares', 'Enlarge 3D Lots Master Plan', 'Agrandir le Plan Masse 3D des Terrains')}</span>
            </button>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-[0.14em] text-[11px] border-b border-stone-200 font-semibold">
                <tr>
                  <th className="py-4 px-6">{tText('Unidad', 'Unit', 'Unité')}</th>
                  <th className="py-4 px-4">{tText('Tipología', 'Typology', 'Typologie')}</th>
                  <th className="py-4 px-4">{tText('Solar (m²)', 'Lot (sqm)', 'Terrain (m²)')}</th>
                  <th className="py-4 px-4">{tText('Construcción', 'Built Area', 'Surface')}</th>
                  <th className="py-4 px-4">{tText('Configuración', 'Layout', 'Configuration')}</th>
                  <th className="py-4 px-4">
                    {tText('Precio', 'Price', 'Prix')} ({selectedPackage.toUpperCase()})
                  </th>
                  <th className="py-4 px-4">{tText('Estado', 'Status', 'Statut')}</th>
                  <th className="py-4 px-6 text-right">{tText('Contacto', 'Contact', 'Contact')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {unitsData.map((unit) => {
                  const currentPrice =
                    selectedPackage === 'royal'
                      ? unit.royal_price
                      : selectedPackage === 'deluxe'
                      ? unit.deluxe_price
                      : unit.base_price;

                  return (
                    <tr
                      key={unit.unit_code}
                      className="hover:bg-stone-50/80 transition-colors group"
                    >
                      <td className="py-4 px-6 font-mono font-bold text-stone-900 text-base">
                        #{unit.unit_code}
                      </td>
                      <td className="py-4 px-4 font-medium text-stone-900"><LocalizedText text={"Eco Suite"} /></td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-stone-900">{unit.lot_sqm.toFixed(2)}</span><LocalizedText text={" m²"} /></td>
                      <td className="py-4 px-4 text-stone-600">
                        {unit.construction_sqm.toFixed(2)}<LocalizedText text={" m²"} /></td>
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-2.5 text-xs text-stone-700 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200/70">
                          <span className="inline-flex items-center gap-1" title={tText('1 Habitación', '1 Bedroom', '1 Chambre')}>
                            <Bed className="w-3.5 h-3.5 text-stone-500" />
                            <span className="font-semibold text-stone-900">1</span>
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="inline-flex items-center gap-1" title={tText('1 Baño', '1 Bathroom', '1 Salle de bain')}>
                            <Bath className="w-3.5 h-3.5 text-stone-500" />
                            <span className="font-semibold text-stone-900">1</span>
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="inline-flex items-center gap-1" title={tText('1 Parqueo', '1 Parking', '1 Parking')}>
                            <Car className="w-3.5 h-3.5 text-stone-500" />
                            <span className="font-semibold text-stone-900">1</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-serif font-bold text-base text-stone-900">
                          {formatCurrency(currentPrice)}
                        </span>
                        {selectedPackage === 'deluxe' && (
                          <span className="block text-[10px] text-[#B89368] font-medium">
                            {tText('Amueblado y equipado', 'Furnished and equipped', 'Meublé et équipé')}
                          </span>
                        )}
                        {selectedPackage === 'royal' && (
                          <span className="block text-[10px] text-emerald-600 font-medium">
                            {tText('Picuzzi y paneles solares', 'Picuzzi and solar panels', 'Picuzzi et panneaux solaires')}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {isUnitSold(unit.status) ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-500 border border-stone-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                            {tText('Vendida', 'Sold', 'Vendue')}
                          </span>
                        ) : isUnitReserved(unit.status) ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {tText('Reservada', 'Reserved', 'Réservée')}
                          </span>
                        ) : isUnitAvailable(unit.status) ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {tText('Disponible', 'Available', 'Disponible')}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-stone-500">{tText('No disponible', 'Unavailable', 'Indisponible')}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {!isUnitAvailable(unit.status) ? (
                          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                            {tText('No disponible', 'Unavailable', 'Indisponible')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenContact(unit.unit_code)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition shadow-xs cursor-pointer"
                          >
                            <span>{tText('Apartar', 'Reserve', 'Réserver')}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW (NO OVERFLOW, CLEAN SPACING) */}
          <div className="md:hidden space-y-4">
            {unitsData.map((unit) => {
              const currentPrice =
                selectedPackage === 'royal'
                  ? unit.royal_price
                  : selectedPackage === 'deluxe'
                  ? unit.deluxe_price
                  : unit.base_price;

              return (
                <div
                  key={unit.unit_code}
                  className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-stone-900">
                        {tText('Unidad', 'Unit', 'Unité')} #{unit.unit_code}
                      </span>
                      <span className="text-xs text-stone-500 font-medium"><LocalizedText text={"Eco Suite"} /></span>
                    </div>
                    {isUnitSold(unit.status) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-500 border border-stone-200">
                        {tText('Vendida', 'Sold', 'Vendue')}
                      </span>
                    ) : isUnitReserved(unit.status) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {tText('Reservada', 'Reserved', 'Réservée')}
                      </span>
                    ) : isUnitAvailable(unit.status) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tText('Disponible', 'Available', 'Disponible')}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-stone-500">{tText('No disponible', 'Unavailable', 'Indisponible')}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-700 bg-stone-50 px-3 py-2 rounded-xl border border-stone-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Bed className="w-3.5 h-3.5 text-stone-500" />
                      <span>{tText('1 Hab', '1 Bed', '1 Ch.')}</span>
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Bath className="w-3.5 h-3.5 text-stone-500" />
                      <span>{tText('1 Baño', '1 Bath', '1 SdB')}</span>
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-stone-500" />
                      <span>{tText('1 Parqueo', '1 Parking', '1 Stat.')}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-stone-600">
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                        {tText('Solar Privado', 'Private Lot', 'Terrain Privé')}
                      </span>
                      <span className="font-bold text-stone-900 text-sm">{unit.lot_sqm.toFixed(2)}<LocalizedText text={" m²"} /></span>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                        {tText('Construcción', 'Built Area', 'Surface')}
                      </span>
                      <span className="font-bold text-stone-900 text-sm">{unit.construction_sqm.toFixed(2)}<LocalizedText text={" m²"} /></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                        {tText('Precio', 'Price', 'Prix')} ({selectedPackage.toUpperCase()})
                      </span>
                      <span className="font-serif text-lg font-bold text-stone-900">
                        {formatCurrency(currentPrice)}
                      </span>
                    </div>

                    {!isUnitAvailable(unit.status) ? (
                      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        {tText('No disponible', 'Unavailable', 'Indisponible')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenContact(unit.unit_code)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition shadow-xs cursor-pointer"
                      >
                        <span>{tText('Apartar', 'Reserve', 'Réserver')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center text-xs text-stone-500">
            {tText(
              '* Aparta cualquier solar con US$ 500 completando el formulario. El saldo del inicial (20%) se completa a la firma del contrato.',
              '* Reserve any lot with US$ 500 by completing the form. The remaining down payment (20%) is due upon contract signing.',
              '* Réservez n’importe quel terrain avec 500 $US via le formulaire. Le solde du versement initial (20%) est complété à la signature du contrat.'
            )}
          </div>
        </div>
      </section>

      {/* LA ECO SUITE / 3D ARCHITECTURE SECTION (FIXED TRUNCATION IN MOBILE CARDS) */}
      <section id="eco-suite" className="py-20 lg:py-28 px-5 sm:px-8 border-b border-stone-200 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 text-[11px] font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89368]" />
                {tText('Tipología Única · Eco Suite', 'Unique Typology · Eco Suite', 'Typologie Unique · Éco Suite')}
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif text-stone-900 leading-tight">
                {tText('Espacios fluidos diseñados para fundirse con la vegetación.', 'Flowing spaces designed to merge with surrounding nature.', 'Des espaces fluides conçus pour fusionner avec la végétation.')}
              </h2>

              <p className="text-stone-600 text-sm leading-relaxed">
                {tText(
                  'Cada Eco Suite está concebida como un santuario individual de 67.50 m² construidos sobre su propio terreno independiente. Los techos altos y ventanales corredizos permiten que la brisa marina y la luz natural circulen continuamente.',
                  'Each Eco Suite is designed as an individual 67.50 sqm sanctuary built on its own private lot. Soaring ceilings and sliding glass doors allow sea breezes and natural light to flow effortlessly.',
                  'Chaque Éco Suite est conçue comme un sanctuaire individuel de 67,50 m² bâti sur son propre terrain indépendant. Les hauts plafonds et baies vitrées coulissantes laissent circuler la brise marine et la lumière naturelle.'
                )}
              </p>

              {/* 3 Metric Cards with no text truncation on mobile */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
                <div className="p-3 sm:p-4 rounded-xl bg-white border border-stone-200 text-center">
                  <span className="text-lg sm:text-xl font-serif font-bold text-stone-900 block"><LocalizedText text={"35 m²"} /></span>
                  <span className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wider mt-0.5 block font-medium">
                    {tText('Interior', 'Interior', 'Intérieur')}
                  </span>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-white border border-stone-200 text-center">
                  <span className="text-lg sm:text-xl font-serif font-bold text-stone-900 block"><LocalizedText text={"20 m²"} /></span>
                  <span className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wider mt-0.5 block font-medium">
                    {tText('Terraza Deck', 'Deck Terrace', 'Terrasse Deck')}
                  </span>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-white border border-stone-200 text-center">
                  <span className="text-lg sm:text-xl font-serif font-bold text-stone-900 block"><LocalizedText text={"12.5 m²"} /></span>
                  <span className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wider mt-0.5 block font-medium">
                    {tText('Parqueo', 'Parking', 'Parking')}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="#disponibilidad"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-stone-900 hover:text-[#B89368] transition-colors"
                >
                  <span>{tText('Elegir un solar para mi Eco Suite', 'Select a lot for my Eco Suite', 'Choisir un terrain pour mon Éco Suite')}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div
                className="rounded-3xl overflow-hidden border border-stone-200 bg-white shadow-lg relative aspect-[4/3] group cursor-pointer"
                onClick={() => setLightboxImage('/images/projects/elements/plano-tipologia-3d.jpg')}
              >
                <UITranslationBoundary attributes={["alt"]}><Image
                  src="/images/projects/elements/plano-tipologia-3d.jpg"
                  alt="Plano Isométrico 3D Eco Suite"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                /></UITranslationBoundary>
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-stone-900/80 text-white text-xs backdrop-blur-md flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-[#B89368]" />
                  <span>{tText('Click para ver Plano 3D completo', 'Click to view full 3D Floorplan', 'Cliquer pour voir le plan 3D complet')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY & RENDERS — INFINITE MARQUEE STRIP */}
      <section id="galeria" className="py-20 lg:py-28 border-b border-stone-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F2EB] border border-stone-200 text-stone-700 text-[11px] font-semibold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89368]" />
                {tText('Galería Visual & Renders', 'Visual Gallery & Renders', 'Galerie Visuelle & Rendus')}
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif text-stone-900 font-semibold">
                {tText('Recorrido Arquitectónico', 'Architectural Tour', 'Visite Architecturale')}
              </h2>
              <p className="mt-2 text-stone-500 text-sm max-w-xl">
                {tText(
                  'Pasa el mouse sobre una imagen para detener el recorrido y ampliarla. En móvil, desliza horizontalmente.',
                  'Hover over an image to pause and enlarge. On mobile, swipe horizontally.',
                  'Survolez une image pour mettre en pause et agrandir. Sur mobile, faites glisser.'
                )}
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {[
                { id: 'todos', label: tText('Todos', 'All', 'Tous') },
                { id: 'exteriores', label: tText('Exteriores', 'Exteriors', 'Extérieurs') },
                { id: 'eco-suite', label: tText('Eco Suite', 'Eco Suite', 'Éco Suite') },
                { id: 'planos', label: tText('Planos 3D & Master Plan', '3D Plans & Master Plan', 'Plans 3D & Plan Masse') },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-[#F5F2EB] text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP: Infinite auto-scrolling marquee */}
        <div className="hidden sm:block relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />

          <div
            className="group flex gap-5 w-max"
            style={{
              animation: 'elements-marquee 40s linear infinite',
            }}
          >
            {/* Double the items so the loop is seamless */}
            {[...filteredShowcase, ...filteredShowcase].map((item, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxImage(item.image)}
                className="relative shrink-0 w-72 lg:w-80 rounded-2xl overflow-hidden cursor-pointer border border-stone-200/60 shadow-sm
                  transition-all duration-500 ease-out
                  hover:w-[420px] lg:hover:w-[500px] hover:shadow-xl hover:border-[#B89368]/40
                  group/card"
                style={{ animationPlayState: 'running' }}
                onMouseEnter={(e) => {
                  const strip = e.currentTarget.parentElement;
                  if (strip) strip.style.animationPlayState = 'paused';
                }}
                onMouseLeave={(e) => {
                  const strip = e.currentTarget.parentElement;
                  if (strip) strip.style.animationPlayState = 'running';
                }}
              >
                <div className="relative h-64 lg:h-72 overflow-hidden bg-stone-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="500px"
                    className="object-cover object-center transition-transform duration-700 group-hover/card:scale-105"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300">
                    <h3 className="font-serif text-white text-sm font-semibold leading-tight">{getShowcaseText(item.title, item.desc).title}</h3>
                    <p className="text-white/70 text-xs mt-1 line-clamp-2">{getShowcaseText(item.title, item.desc).desc}</p>
                  </div>
                  {/* Expand icon */}
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Inject keyframes via style tag */}
          <style>{`
            @keyframes elements-marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .group:hover > div {
              animation-play-state: paused !important;
            }
          `}</style>
        </div>

        {/* MOBILE: horizontal scroll strip */}
        <div className="sm:hidden overflow-x-auto pb-4 px-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-4 w-max">
            {filteredShowcase.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxImage(item.image)}
                className="relative shrink-0 w-64 rounded-2xl overflow-hidden cursor-pointer border border-stone-200 shadow-sm active:scale-95 transition-transform"
              >
                <div className="relative h-48 bg-stone-100">
                  <Image
                    src={item.image}
                    alt={getShowcaseText(item.title, item.desc).title}
                    fill
                    sizes="260px"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-serif text-white text-xs font-semibold leading-tight">{getShowcaseText(item.title, item.desc).title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AMENITIES SECTION */}
      <section id="amenidades" className="py-20 lg:py-28 px-5 sm:px-8 border-b border-stone-200 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 text-[11px] font-semibold tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B89368]" />
              {tText('Entorno & Servicios', 'Surroundings & Services', 'Cadre & Services')}
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif text-stone-900">
              {tText('Amenidades concebidas para el bienestar integral.', 'Amenities designed for holistic well-being.', 'Des équipements conçus pour un bien-être intégral.')}
            </h2>
            <p className="mt-3 text-stone-600 text-sm leading-relaxed">
              {tText(
                'Cada rincón de Elements está planificado para convivir en equilibrio con los recursos naturales del entorno caribeño.',
                'Every corner of Elements is thoughtfully planned to thrive in harmony with the natural Caribbean landscape.',
                'Chaque recoin d’Elements est pensé pour vivre en harmonie avec les ressources naturelles caribéennes.'
              )}
            </p>
          </FadeSection>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {AMENITIES.map((amenity, idx) => {
              const IconComp = amenity.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.1)', borderColor: '#B89368' }}
                  className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs transition-colors duration-300 flex flex-col justify-between text-left cursor-default"
                >
                  <div>
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.15 }}
                      className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-800 mb-3"
                    >
                      <IconComp className="w-5 h-5 text-[#B89368]" />
                    </motion.div>
                    <h3 className="text-sm font-semibold text-stone-900">
                      {tText(
                        amenity.title,
                        amenity.title === 'Seguridad 24/7' ? '24/7 Security' :
                        amenity.title === 'Senderos Ecológicos' ? 'Ecological Trails' :
                        amenity.title === 'Jardín Biofílico' ? 'Biophilic Garden' :
                        amenity.title === 'Área Social & BBQ' ? 'Social Area & BBQ' :
                        amenity.title === 'Playas Vírgenes' ? 'Pristine Beaches' :
                        amenity.title === 'Sustentabilidad' ? 'Sustainability' :
                        amenity.title === 'Parqueo Asignado' ? 'Assigned Parking' :
                        amenity.title === 'Yoga & Bienestar' ? 'Yoga & Wellness' :
                        amenity.title === 'Comunidad Pet Friendly' ? 'Pet Friendly Community' :
                        'Private Picuzzi',
                        amenity.title === 'Seguridad 24/7' ? 'Sécurité 24/7' :
                        amenity.title === 'Senderos Ecológicos' ? 'Sentiers Écologiques' :
                        amenity.title === 'Jardín Biofílico' ? 'Jardin Biophilique' :
                        amenity.title === 'Área Social & BBQ' ? 'Espace Convivial & Barbecue' :
                        amenity.title === 'Playas Vírgenes' ? 'Plages Vierges' :
                        amenity.title === 'Sustentabilidad' ? 'Durabilité' :
                        amenity.title === 'Parqueo Asignado' ? 'Parking Attitré' :
                        amenity.title === 'Yoga & Bienestar' ? 'Yoga & Bien-être' :
                        amenity.title === 'Comunidad Pet Friendly' ? 'Communauté Pet Friendly' :
                        'Picuzzi privé'
                      )}
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                    {tText(
                      amenity.desc,
                      amenity.desc === 'Control de acceso vigilado y garita perimetral con circuito cerrado' ? 'Gated access control and perimeter guardhouse with CCTV' :
                      amenity.desc === 'Caminerías inmersas en flora autóctona y áreas protegidas' ? 'Walkways immersed in native flora and protected green spaces' :
                      amenity.desc === 'Diseño paisajístico de bajo consumo hídrico y especies endémicas' ? 'Water-efficient landscape design with endemic tropical species' :
                      amenity.desc === 'Zona de esparcimiento comunitaria para residentes y propietarios' ? 'Community recreation area for owners and residents' :
                      amenity.desc === 'A solo minutos del litoral virgen e inexplorado de Nisibón' ? 'Just minutes from the untouched, uncrowded Nisibón shoreline' :
                      amenity.desc === 'Preinstalación para energía solar y diseño eco-eficiente pasivo' ? 'Pre-installation for solar energy and passive eco-efficient design' :
                      amenity.desc === 'Estacionamiento privado de 12.50 m² frente a cada Eco Suite' ? 'Private 12.50 sqm designated parking stall in front of each Eco Suite' :
                      amenity.desc === 'Espacios al aire libre diseñados para relajación, meditación y fitness' ? 'Open-air spaces dedicated to relaxation, meditation, and fitness' :
                      amenity.desc === 'Entorno abierto y seguro para disfrutar con mascotas' ? 'Open, safe tropical sanctuary to enjoy with your pets' :
                      'Included with Eco Royal',
                      amenity.desc === 'Control de acceso vigilado y garita perimetral con circuito cerrado' ? 'Contrôle d’accès surveillé et poste de garde avec vidéosurveillance' :
                      amenity.desc === 'Caminerías inmersas en flora autóctona y áreas protegidas' ? 'Chemins immergés dans la flore locale et espaces protégés' :
                      amenity.desc === 'Diseño paisajístico de bajo consumo hídrico y especies endémicas' ? 'Aménagement paysager à faible consommation d’eau et espèces endémiques' :
                      amenity.desc === 'Zona de esparcimiento comunitaria para residentes y propietarios' ? 'Espace de loisirs communautaire pour résidents et propriétaires' :
                      amenity.desc === 'A solo minutos del litoral virgen e inexplorado de Nisibón' ? 'À quelques minutes du littoral vierge et sauvage de Nisibón' :
                      amenity.desc === 'Preinstalación para energía solar y diseño eco-eficiente pasivo' ? 'Pré-équipement pour énergie solaire et conception éco-efficace passive' :
                      amenity.desc === 'Estacionamiento privado de 12.50 m² frente a cada Eco Suite' ? 'Stationnement privé de 12,50 m² devant chaque Éco Suite' :
                      amenity.desc === 'Espacios al aire libre diseñados para relajación, meditación y fitness' ? 'Espaces en plein air dédiés à la relaxation, méditation et bien-être' :
                      amenity.desc === 'Entorno abierto y seguro para disfrutar con mascotas' ? 'Cadre ouvert et sécurisé pour profiter avec vos animaux de compagnie' :
                      'Inclus avec Eco Royal'
                    )}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* PAYMENT TIMELINE */}
      <section id="planes-pago" className="py-20 lg:py-28 px-5 sm:px-8 border-b border-stone-200 bg-[#F5F2EB]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 text-[11px] font-semibold tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B89368]" />
              {tText('Esquema de Inversión', 'Investment Scheme', 'Schéma d’Investissement')}
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif text-stone-900">
              {tText('Facilidades de Pago & Rentabilidad', 'Payment Terms & Profitability', 'Facilités de Paiement & Rentabilité')}
            </h2>
            <p className="mt-3 text-stone-600 text-sm leading-relaxed">
              {tText(
                'Estructura financiera diseñada para inversionistas con aportes escalonados durante la construcción y entrega en Diciembre 2027.',
                'Financial schedule tailored for investors with milestone-based installments during construction and completion in December 2027.',
                'Structure financière pensée pour les investisseurs avec versements échelonnés pendant les travaux et livraison en décembre 2027.'
              )}
            </p>
          </div>

          {/* PLAN A: 20/30/50 */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 text-[11px] font-semibold tracking-wider uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {tText('Plan A · 20 / 30 / 50', 'Plan A · 20 / 30 / 50', 'Plan A · 20 / 30 / 50')}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: tText('Reserva', 'Reservation', 'Réservation'),
                val: 'US $500',
                desc: tText('Aparta el número de solar seleccionado para tu Eco Suite.', 'Reserve the selected lot number for your Eco Suite.', 'Réservez le numéro de terrain sélectionné pour votre Éco Suite.'),
              },
              {
                step: '02',
                title: tText('Separación', 'Down Payment', 'Versement Initial'),
                val: '20%',
                desc: tText('A la firma del contrato de promesa de compraventa (30 días).', 'Upon signing the purchase promise agreement (30 days).', 'À la signature du contrat de promesse de vente (30 jours).'),
              },
              {
                step: '03',
                title: tText('Construcción', 'During Construction', 'Pendant la Construction'),
                val: '30%',
                desc: tText('Cuotas flexibles mensuales durante la obra.', 'Flexible monthly installments during construction.', 'Versements mensuels flexibles pendant les travaux.'),
              },
              {
                step: '04',
                title: tText('Contra Entrega', 'Upon Delivery', 'À la Livraison'),
                val: '50%',
                desc: tText('A la entrega de llaves y título (Diciembre 2027).', 'Upon key and title handover (December 2027).', 'À la remise des clés et du titre (décembre 2027).'),
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl bg-white border border-stone-200 shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stone-400 block">
                    {tText('Paso', 'Step', 'Étape')} {p.step}
                  </span>
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2 block">
                    {p.val}
                  </span>
                  <h4 className="text-sm font-semibold text-stone-800 mt-1">
                    {p.title}
                  </h4>
                </div>
                <p className="text-xs text-stone-500 mt-4 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          {/* PLAN B: 10/50/40 */}
          <div className="mt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B89368]/10 border border-[#B89368]/30 text-[#8A663E] text-[11px] font-semibold tracking-wider uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B89368]" />
              {tText('Plan B · 10 / 50 / 40', 'Plan B · 10 / 50 / 40', 'Plan B · 10 / 50 / 40')}
            </div>
            <p className="mb-6 text-stone-600 text-sm max-w-2xl leading-relaxed">
              {tText(
                'Ideal para inversionistas que prefieren menor compromiso inicial, con mayor proporción durante la construcción y entrega.',
                'Ideal for investors who prefer a lower initial commitment, with a larger proportion spread over construction and delivery.',
                'Idéal pour les investisseurs préférant un engagement initial réduit, avec une proportion plus élevée répartie sur la construction et la livraison.'
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: tText('Reserva', 'Reservation', 'Réservation'),
                  val: 'US $500',
                  desc: tText('Aparta el número de solar seleccionado para tu Eco Suite.', 'Reserve the selected lot number for your Eco Suite.', 'Réservez le numéro de terrain sélectionné pour votre Éco Suite.'),
                  accent: false,
                },
                {
                  step: '02',
                  title: tText('Separación', 'Down Payment', 'Versement Initial'),
                  val: '10%',
                  desc: tText('A la firma del contrato de promesa de compraventa (30 días).', 'Upon signing the purchase promise agreement (30 days).', 'À la signature du contrat de promesse de vente (30 jours).'),
                  accent: true,
                },
                {
                  step: '03',
                  title: tText('Construcción', 'During Construction', 'Pendant la Construction'),
                  val: '50%',
                  desc: tText('Cuotas flexibles mensuales durante la obra.', 'Flexible monthly installments during construction.', 'Versements mensuels flexibles pendant les travaux.'),
                  accent: true,
                },
                {
                  step: '04',
                  title: tText('Contra Entrega', 'Upon Delivery', 'À la Livraison'),
                  val: '40%',
                  desc: tText('A la entrega de llaves y título (Diciembre 2027).', 'Upon key and title handover (December 2027).', 'À la remise des clés et du titre (décembre 2027).'),
                  accent: false,
                },
              ].map((p, idx) => (
                <div
                  key={idx}
                  className={`p-6 sm:p-7 rounded-2xl border shadow-xs relative flex flex-col justify-between ${p.accent ? 'bg-[#B89368]/5 border-[#B89368]/25' : 'bg-white border-stone-200'}`}
                >
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stone-400 block">
                      {tText('Paso', 'Step', 'Étape')} {p.step}
                    </span>
                    <span className={`text-2xl sm:text-3xl font-serif font-bold mt-2 block ${p.accent ? 'text-[#B89368]' : 'text-stone-900'}`}>
                      {p.val}
                    </span>
                    <h4 className="text-sm font-semibold text-stone-800 mt-1">
                      {p.title}
                    </h4>
                  </div>
                  <p className="text-xs text-stone-500 mt-4 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & OFFICIAL INQUIRY FORM SECTION */}
      <section id="contacto" className="py-20 lg:py-28 px-5 sm:px-8 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-300 text-stone-700 text-[11px] font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {tText('Atención Oficial', 'Official Inquiries', 'Service Officiel')}
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif text-stone-900 leading-tight">
                {tText('Atención Comercial & Reservas', 'Commercial Inquiries & Reservations', 'Service Commercial & Réservations')}
              </h2>

              <p className="text-stone-600 text-sm leading-relaxed">
                {tText(
                  'Recibe el dossier completo en PDF, planos arquitectónicos con cotas, disponibilidad actualizada y simulación financiera personalizada según tu paquete de interés.',
                  'Receive the full PDF dossier, scaled architectural plans, live availability, and a tailored financial forecast based on your preferred package.',
                  'Recevez le dossier complet en PDF, les plans architecturaux cotés, la disponibilité à jour et une simulation financière personnalisée selon votre forfait.'
                )}
              </p>

              <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-stone-200 flex items-center justify-center text-[#B89368] font-bold font-serif text-base shrink-0">
                    <ShieldCheck className="w-6 h-6 text-[#B89368]" />
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-stone-900">
                      {tText('Equipo Comercial Elements', 'Elements Sales Advisory Team', 'Équipe Commerciale Elements')}
                    </h4>
                    <p className="text-xs text-stone-500">
                      {tText('Gestión directa y seguimiento oficial', 'Direct advisory and official representation', 'Accompagnement direct et suivi officiel')}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-2.5 text-xs text-stone-600">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{tText('Disponibilidad en tiempo real y bloqueo de solar', 'Real-time lot availability and reservation lock', 'Disponibilité en temps réel et blocage de lot')}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{tText('Reserva oficial con solo US $500', 'Official reservation with only US $500', 'Réservation officielle dès 500 $US')}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{tText('Acompañamiento legal y financiero integral', 'Comprehensive legal and financial advisory', 'Accompagnement juridique et financier complet')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm">
                <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
                  {tText('Formulario de Contacto & Reserva', 'Contact & Reservation Form', 'Formulaire de Contact & Réservation')}
                </h3>
                <p className="text-xs text-stone-500 mb-6">
                  {tText(
                    'Completa tus datos y nos comunicaremos de inmediato con la memoria de calidades y pasos para apartar tu solar.',
                    'Fill out your details and we will get back to you promptly with building specs and lot reservation steps.',
                    'Renseignez vos coordonnées et nous vous répondrons aussitôt avec le cahier des charges et les étapes de réservation.'
                  )}
                </p>

                <LeadCaptureForm
                  projectId={project.id}
                  projectSlug={project.slug}
                  projectName={project.name}
                  accentClassName="bg-stone-900 hover:bg-stone-800 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-14 px-5 sm:px-8 bg-[#2C2A27] text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-10 md:grid-cols-[1.2fr_.7fr_.7fr_1fr] md:gap-12">
            {/* Brand */}
            <div>
              <div className="relative h-14 w-52 shrink-0 mb-5">
                <UITranslationBoundary attributes={["alt"]}><Image
                  src="/images/projects/elements/logo-horizontal.png"
                  alt="Elements Residences"
                  fill
                  sizes="280px"
                  className="object-contain object-left brightness-200 saturate-0"
                /></UITranslationBoundary>
              </div>
              <p className="font-serif text-2xl leading-snug text-stone-300 max-w-xs">
                {tText('Vive en armonía con la naturaleza virgen del Caribe.', 'Live in harmony with the pristine Caribbean nature.', 'Vivez en harmonie avec la nature vierge des Caraïbes.')}
              </p>
              <p className="mt-4 text-sm text-stone-500 leading-relaxed max-w-xs">
                {tText('Santuario Residencial Biofílico · 12 Eco Suites · Nisibón, La Altagracia.', 'Biophilic Residential Sanctuary · 12 Eco Suites · Nisibón, La Altagracia.', 'Sanctuaire Résidentiel Biophilique · 12 Éco Suites · Nisibón, La Altagracia.')}
              </p>
            </div>

            {/* Explorar */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#B89368] mb-5">
                {tText('Explorar', 'Explore', 'Explorer')}
              </p>
              <div className="grid gap-3 text-sm text-stone-400">
                <a href="#concepto" className="transition hover:text-white">{tText('Concepto', 'Concept', 'Concept')}</a>
                <a href="#paquetes" className="transition hover:text-white">{tText('Paquetes', 'Packages', 'Forfaits')}</a>
                <a href="#disponibilidad" className="transition hover:text-white">{tText('Disponibilidad', 'Availability', 'Disponibilité')}</a>
                <a href="#galeria" className="transition hover:text-white">{tText('Galería', 'Gallery', 'Galerie')}</a>
                <a href="#planes-pago" className="transition hover:text-white">{tText('Planes de Pago', 'Payment Plans', 'Plans de Paiement')}</a>
                <a href="#contacto" className="transition hover:text-white">{tText('Contacto', 'Contact', 'Contact')}</a>
              </div>
            </div>

            {/* Área Broker */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#B89368] mb-5">
                {tText('Área Broker', 'Broker Area', 'Espace Broker')}
              </p>
              <div className="grid gap-3 text-sm text-stone-400">
                <a href="#contacto" className="transition hover:text-white">{tText('Solicitar Información', 'Request Info', 'Demander des Infos')}</a>
                <Link href="/login?next=/proyectos/elements" className="transition hover:text-white">{tText('Acceso Brokers', 'Brokers Access', 'Accès Brokers')}</Link>
                <Link href="/proyectos" className="transition hover:text-white">{tText('Volver al Portal', 'Back to Portal', 'Retour au Portail')}</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#B89368] mb-5">
                {tText('Información Legal', 'Legal Information', 'Informations Légales')}
              </p>
              <div className="grid gap-3 text-sm text-stone-400">
                <Link href="/legal#disclaimer" className="transition hover:text-white">{tText('Disclaimer y Responsabilidad', 'Disclaimer & Liability', 'Avertissement et Responsabilité')}</Link>
                <Link href="/legal#privacidad" className="transition hover:text-white">{tText('Política de Privacidad', 'Privacy Policy', 'Politique de Confidentialité')}</Link>
                <Link href="/legal#cookies" className="transition hover:text-white">{tText('Política de Cookies', 'Cookie Policy', 'Politique de Cookies')}</Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[.14em] text-stone-600 sm:flex-row sm:items-center sm:justify-between" suppressHydrationWarning>
            <span>© {new Date().getFullYear()}<LocalizedText text={" Elements Residences &amp; Resort · OB Brokers Team. "} />{tText('Todos los derechos reservados.', 'All rights reserved.', 'Tous droits réservés.')}</span>
            <span className="flex items-center gap-2">
              <MapPin className="h-3 w-3" /> {tText('Nisibón, La Altagracia, República Dominicana', 'Nisibón, La Altagracia, Dominican Republic', 'Nisibón, La Altagracia, République Dominicaine')}
            </span>
          </div>
        </div>
      </footer>

      {/* CONTACT MODAL FOR APARTAR / CONTACTAR BUTTONS */}
      {contactModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setContactModalOpen(false);
          }}
        >
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {modalTargetUnit
                    ? `${tText('Apartar Eco Suite #', 'Reserve Eco Suite #', 'Réserver l’Éco Suite #')}${modalTargetUnit}`
                    : tText('Atención & Reservas', 'Inquiries & Reservations', 'Conseil & Réservations')}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {modalTargetUnit
                    ? `Elements Residences & Resort · ${tText('Paquete', 'Package', 'Forfait')} ${selectedPackage.toUpperCase()}`
                    : tText('Equipo Comercial Oficial · Elements Residences', 'Official Sales Advisory · Elements Residences', 'Équipe Commerciale Officielle · Elements Residences')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <LeadCaptureForm
              projectId={project.id}
              projectSlug={project.slug}
              projectName={project.name}
              initialMessage={
                modalTargetUnit
                  ? tText(
                      `Hola, me interesa apartar la Eco Suite #${modalTargetUnit} en Elements Residences (Nisibón) con el paquete ${selectedPackage.toUpperCase()}. Deseo recibir la confirmación y pasos de pago.`,
                      `Hello, I am interested in reserving Eco Suite #${modalTargetUnit} at Elements Residences (Nisibón) with the ${selectedPackage.toUpperCase()} package. I would like to receive confirmation and payment steps.`,
                      `Bonjour, je souhaite réserver l'Éco Suite #${modalTargetUnit} à Elements Residences (Nisibón) avec le forfait ${selectedPackage.toUpperCase()}. Je souhaite recevoir la confirmation et les étapes de paiement.`
                    )
                  : tText(
                      'Hola, deseo recibir información y disponibilidad de Elements Residences & Resort en Nisibón.',
                      'Hello, I would like to receive information and availability for Elements Residences & Resort in Nisibón.',
                      'Bonjour, je souhaite recevoir des informations et la disponibilité pour Elements Residences & Resort à Nisibón.'
                    )
              }
              accentClassName="bg-stone-900 hover:bg-stone-800 text-white"
            />
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR HIGH-RES PLANOS & RENDERS */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full h-[80vh]">
              <UITranslationBoundary attributes={["alt"]}><Image
                src={lightboxImage}
                alt="Vista ampliada"
                fill
                sizes="100vw"
                className="object-contain"
                priority
              /></UITranslationBoundary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
