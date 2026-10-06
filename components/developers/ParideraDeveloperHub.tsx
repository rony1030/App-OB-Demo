'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { CurrentSessionUser } from '@/lib/auth/get-user';
import type { PortalProject } from '@/lib/portal-projects';
import {
  PARIDERA_INVENTORY_DATE,
  PARIDERA_PHASES,
  type ParideraPhase,
} from '@/lib/data/paridera-portfolio';
import {
  Eyebrow,
  ParallaxImage,
  ParideraFooter,
  ParideraHeader,
  ParideraShell,
  Reveal,
  RollButton,
  WordReveal,
  usd,
} from '@/components/paridera/ParideraKit';
import ParideraAvailability from '@/components/paridera/ParideraAvailability';
import { ParideraAmenities, ParideraHero, ParideraLocation, ParideraPlans } from '@/components/paridera/ParideraSections';

export interface ParideraDeveloperHubProps {
  projects: PortalProject[];
  currentUser: CurrentSessionUser | null;
}

const HERO_SLIDES = [
  { src: '/paridera/hub/sunrise-hero.jpg', caption: 'Sunrise desde la playa' },
  { src: '/paridera/hub/sunrise-beach.jpg', caption: 'Beach Club & playa privada' },
  { src: '/paridera/hub/sunrise-rooftop.jpg', caption: 'Rooftop 360° · planta 9' },
  { src: '/paridera/hub/sunrise-golf.jpg', caption: 'Vista desde Las Iguanas' },
];

const TOTAL_RESIDENCES = PARIDERA_PHASES.reduce((sum, phase) => sum + phase.inventory.total, 0);

export default function ParideraDeveloperHub({ currentUser }: ParideraDeveloperHubProps) {
  return (
    <ParideraShell>
      <ParideraHeader
        nav={[
          { href: '#desarrollos', label: 'Desarrollos' },
          { href: '#disponibilidad', label: 'Disponibilidad' },
          { href: '#amenidades', label: 'Amenidades' },
          { href: '#cap-cana', label: 'Cap Cana' },
        ]}
        cta={currentUser ? { href: '/portal', label: 'Ir al portal' } : { href: '/proyectos/sunrise-bonita-beach', label: 'Ver Sunrise' }}
      />
      <main>
        <ParideraHero
          slides={HERO_SLIDES}
          title={
            <>
              Frente al mar,
              <br />
              en el corazón de <em>Cap&nbsp;Cana</em>
            </>
          }
          intro="Apartamentos, villas y residencias de golf con playa privada, en el campo Las Iguanas."
          actions={
            <>
              <RollButton href="/proyectos/sunrise-bonita-beach">Explorar Sunrise</RollButton>
              <RollButton href="#desarrollos" variant="ghost">Los cinco desarrollos</RollButton>
            </>
          }
          card={PARIDERA_PHASES.map((phase) => ({
            image: phase.cover,
            title: phase.fullName,
            text: `${phase.inventory.available} ${phase.inventory.available === 1 ? 'disponible' : 'disponibles'} · desde ${usd(phase.inventory.fromPrice)}`,
            href: `/proyectos/${phase.slug}`,
          }))}
        />
        <Intro />
        <Marquee />
        <Portfolio />
        <ParideraAvailability />
        <ParideraAmenities action={<RollButton href="/proyectos/sunrise-bonita-beach">Recorrer Sunrise</RollButton>} />
        <Statement />
        <ParideraLocation />
        <ParideraPlans />
        <BrokerCta isAuthenticated={!!currentUser} />
      </main>
      <ParideraFooter />
    </ParideraShell>
  );
}

/* ─── Intro with scroll word reveal + parallax trio ───────────────────────── */

function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] });

  return (
    <section className="pb-section pb-intro">
      <div className="pb-container">
        <div className="pb-intro__grid">
          <div>
            <Eyebrow>Bonita Beach Residences</Eyebrow>
          </div>
          <div ref={ref}>
            <WordReveal
              className="pb-intro__statement"
              progress={scrollYProgress}
              text="Diseñado por GVA Arquitectura y construido sobre el campo de golf Las Iguanas: apartamentos, villas y apartahotel con vistas al mar y una playa privada de 15,000 m²."
            />
            <Reveal delay={0.1}>
              <p className="pb-intro__lead">
                Un proyecto de Paridera Investors dirigido por TLDI, el project manager internacional detrás del St. Regis Cap Cana.
                Confort, diseño atemporal y una inversión pensada para crecer.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="pb-intro__trio">
          <ParallaxImage src="/paridera/hub/sunrise-living.jpg" alt="Sala con terraza" />
          <ParallaxImage src="/paridera/hub/sunrise-pool.jpg" alt="Piscina" offset={90} />
          <ParallaxImage src="/paridera/hub/sunrise-lobby.jpg" alt="Lobby" />
        </div>

        <div className="pb-stats">
          {[
            { value: '15,000', unit: 'm²', label: 'de playa privada artificial' },
            { value: '10', unit: 'min', label: 'del Aeropuerto de Punta Cana' },
            { value: '5', unit: 'min', label: 'de Playa Juanillo' },
            { value: String(TOTAL_RESIDENCES), unit: '', label: 'residencias en cinco desarrollos' },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08} className="pb-stat">
              <div className="pb-stat__value">
                {stat.value}
                {stat.unit && <span>{stat.unit}</span>}
              </div>
              <div className="pb-stat__label">{stat.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Marquee ─────────────────────────────────────────────────────────────── */

function Marquee() {
  const items = ['GVA Arquitectura', 'TLDI Project Management', 'Crystal Lagoons', 'Golf Las Iguanas', 'Jack Nicklaus Signature', 'Cap Cana'];
  return (
    <div className="pb-marquee" aria-label="Socios y entorno del proyecto">
      <div className="pb-marquee__track">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="pb-marquee__item">
            {item}
            <i aria-hidden>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Portfolio — sticky image stack + scrolling panels ───────────────────── */

function PhasePanel({ phase, index, onActive }: { phase: ParideraPhase; index: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  const { total, available, reserved, sold, fromPrice } = phase.inventory;
  const soldPct = Math.round((sold / total) * 100);
  const href = phase.hasLanding ? `/proyectos/${phase.slug}` : null;

  return (
    <article ref={ref} className="pb-phase">
      <div className="pb-phase__mobile-img">
        <Image src={phase.cover} alt={phase.name} fill sizes="100vw" style={{ objectFit: 'cover' }} />
      </div>
      <div className="pb-phase__count">
        {String(index + 1).padStart(2, '0')} <span>/ {String(PARIDERA_PHASES.length).padStart(2, '0')}</span>
      </div>
      <div className="pb-phase__label">{phase.label}</div>
      <h3 className="pb-phase__name">{phase.name}</h3>
      <p className="pb-phase__summary">{phase.summary}</p>

      <div className="pb-phase__availability">
        <div className="pb-phase__avail-head">
          <div>
            <div className="pb-phase__avail-num">{available}</div>
            <div className="pb-phase__avail-cap">disponibles de {total}</div>
          </div>
          <div className="pb-phase__from">
            <span>Desde</span>
            {usd(fromPrice)}
          </div>
        </div>
        <div className="pb-bar" role="img" aria-label={`${soldPct}% vendido`}>
          <motion.span
            className="pb-bar__fill"
            initial={{ width: 0 }}
            whileInView={{ width: `${soldPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="pb-phase__legend">
          <span>{soldPct}% vendido</span>
          {reserved > 0 && <span>{reserved} reservadas</span>}
          <span>Inventario al {phase.inventory.asOf}</span>
        </div>
      </div>

      <div className="pb-phase__meta">
        <div className="pb-phase__meta-title">Tipologías</div>
        <p>{phase.typologies}</p>
      </div>
      <ul className="pb-phase__amenities">
        {phase.amenities.map((amenity) => (
          <li key={amenity}>
            <Plus size={14} strokeWidth={1.75} />
            {amenity}
          </li>
        ))}
      </ul>

      {href ? (
        <RollButton href={href} variant="ink">{`Ver ${phase.name}`}</RollButton>
      ) : (
        <span className="pb-phase__soon">Landing en preparación</span>
      )}
    </article>
  );
}

function Portfolio() {
  const [active, setActive] = useState(0);

  return (
    <section id="desarrollos" className="pb-section pb-portfolio">
      <div className="pb-container">
        <div className="pb-head">
          <div>
            <Eyebrow>Portafolio Paridera Investors</Eyebrow>
            <h2 className="pb-h2">
              Cinco desarrollos,
              <br />
              <em>un mismo destino</em>
            </h2>
          </div>
          <p className="pb-head__aside">
            Disponibilidad real de cada edificio, tomada del inventario oficial del {PARIDERA_INVENTORY_DATE}.
          </p>
        </div>

        <div className="pb-portfolio__grid">
          <div className="pb-portfolio__sticky">
            <div className="pb-portfolio__frame">
              {PARIDERA_PHASES.map((phase, i) => (
                <div key={phase.key} className={`pb-portfolio__img${i === active ? ' is-active' : ''}${i < active ? ' is-past' : ''}`}>
                  <Image src={phase.cover} alt={phase.name} fill sizes="50vw" style={{ objectFit: 'cover' }} />
                </div>
              ))}
              <div className="pb-portfolio__tag">{PARIDERA_PHASES[active].label}</div>
            </div>
          </div>
          <div>
            {PARIDERA_PHASES.map((phase, i) => (
              <PhasePanel key={phase.key} phase={phase} index={i} onActive={setActive} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Sticky statement ───────────────────────────────────────────────────── */

function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [28, 0]);

  return (
    <section ref={ref} className="pb-statement">
      <div className="pb-statement__sticky">
        <motion.div className="pb-statement__bg" style={{ scale, borderRadius: radius }}>
          <Image src="/paridera/hub/sunrise-golf.jpg" alt="Bonita Beach desde el campo de golf" fill sizes="100vw" style={{ objectFit: 'cover' }} />
          <div className="pb-statement__shade" />
        </motion.div>
        <div className="pb-statement__text">
          <WordReveal
            progress={scrollYProgress}
            className="pb-statement__quote"
            text="Despertar frente al Caribe, jugar en un campo firmado por Jack Nicklaus y volver a casa caminando por la playa."
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Broker CTA with colour wipe ────────────────────────────────────────── */

function BrokerCta({ isAuthenticated }: { isAuthenticated: boolean }) {
  const reduce = useReducedMotion();
  return (
    <section className="pb-section pb-section--tight">
      <div className="pb-container">
        <div className="pb-cta">
          <Image src="/paridera/hub/sunrise-beach.jpg" alt="Playa privada de Bonita Beach" fill sizes="100vw" style={{ objectFit: 'cover' }} />
          <div className="pb-cta__shade" />
          <motion.div
            className="pb-cta__wipe"
            initial={reduce ? false : { scaleY: 1 }}
            whileInView={{ scaleY: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
          />
          <div className="pb-cta__content">
            <Eyebrow light>Para brokers</Eyebrow>
            <h2 className="pb-h2">
              ¿Tienes clientes
              <br />
              <em>para Cap Cana?</em>
            </h2>
            <p>Disponibilidad en tiempo real, material oficial de cada fase y cotizaciones con tu marca, en un solo lugar.</p>
            <div className="pb-hero__actions">
              <RollButton href={isAuthenticated ? '/portal' : '/solicitar-acceso'}>{isAuthenticated ? 'Ir al portal' : 'Solicitar acceso'}</RollButton>
              <RollButton href="/proyectos/sunrise-bonita-beach" variant="ghost">Ver Sunrise</RollButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
