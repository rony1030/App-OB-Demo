'use client';

// Page sections shared by the Paridera hub and the project landings.

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PARIDERA_PAYMENT_PLANS, PARIDERA_RESERVATION_USD, type ParideraPaymentPlan } from '@/lib/data/paridera-portfolio';
import { Eyebrow, Reveal, usd } from '@/components/paridera/ParideraKit';

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─── Hero ────────────────────────────────────────────────────────────────── */

export interface HeroSlide {
  src: string;
  caption: string;
}

export interface HeroCard {
  image: string;
  title: string;
  text: string;
  href?: string;
}

const CARD_MS = 4500;

/** Glass card in the hero; with several cards it rotates through them. */
function HeroCards({ cards }: { cards: HeroCard[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rotating = cards.length > 1 && !reduce;

  useEffect(() => {
    if (!rotating || paused) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % cards.length), CARD_MS);
    return () => window.clearTimeout(id);
  }, [rotating, paused, index, cards.length]);

  const card = cards[index];
  const body = (
    <>
      <div className="pb-hero__card-img">
        <AnimatePresence initial={false}>
          <motion.div
            key={card.image}
            className="pb-hero__card-img-inner"
            initial={{ clipPath: 'inset(0 0 0 100%)', scale: 1.15 }}
            animate={{ clipPath: 'inset(0 0 0 0%)', scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <Image src={card.image} alt={card.title} fill sizes="120px" style={{ objectFit: 'cover' }} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="pb-hero__card-copy">
        <motion.div
          key={card.title}
          initial={index === 0 && !rotating ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="pb-hero__card-title">{card.title}</div>
          <p>{card.text}</p>
        </motion.div>
      </div>
      {rotating && (
        <span className="pb-hero__card-progress" aria-hidden>
          <span key={`${index}-${paused}`} className={paused ? '' : 'is-running'} style={{ animationDuration: `${CARD_MS}ms` }} />
        </span>
      )}
    </>
  );

  return card.href ? (
    <Link href={card.href} className="pb-hero__card" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {body}
    </Link>
  ) : (
    <div className="pb-hero__card">{body}</div>
  );
}

export function ParideraHero({
  slides,
  title,
  intro,
  actions,
  card,
}: {
  slides: HeroSlide[];
  title: ReactNode;
  intro: string;
  actions: ReactNode;
  card?: HeroCard | HeroCard[];
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce || slides.length < 2) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % slides.length), 6000);
    return () => window.clearInterval(id);
  }, [reduce, slides.length]);

  return (
    <section className="pb-hero">
      <div className="pb-hero__frame">
        {slides.map((slide, i) => (
          <div key={slide.src} className={`pb-hero__slide${i === active ? ' is-active' : ''}`} aria-hidden={i !== active}>
            <Image src={slide.src} alt={slide.caption} fill priority={i === 0} sizes="100vw" style={{ objectFit: 'cover' }} />
          </div>
        ))}
        <div className="pb-hero__shade" />

        <div className="pb-hero__content">
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE }}>
            {title}
          </motion.h1>
        </div>

        <div className="pb-hero__bottom">
          <motion.div
            className="pb-hero__intro"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
          >
            <p>{intro}</p>
            <div className="pb-hero__actions">{actions}</div>
          </motion.div>

          {card && (
            <motion.div
              className="pb-hero__card-wrap"
              initial={reduce ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: EASE }}
            >
              <HeroCards cards={Array.isArray(card) ? card : [card]} />
            </motion.div>
          )}
        </div>

        {slides.length > 1 && (
          <div className="pb-hero__dots">
            {slides.map((slide, i) => (
              <button key={slide.src} type="button" aria-label={slide.caption} onClick={() => setActive(i)} className={i === active ? 'is-active' : ''}>
                <span />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Amenities — dark wrapper, numbered list, hover image ────────────────── */

export interface AmenityItem {
  title: string;
  text: string;
  image: string;
}

export const BONITA_BEACH_AMENITIES: AmenityItem[] = [
  { title: 'Playa privada Crystal Lagoons', text: '15,000 m² de laguna de arena blanca, desarrollada por una compañía de prestigio mundial.', image: '/paridera/hub/sunrise-beach.jpg' },
  { title: 'Rooftop & Lounge 360°', text: 'En la novena planta, con vistas panorámicas al mar y al golf. Único en Cap Cana.', image: '/paridera/hub/sunrise-rooftop.jpg' },
  { title: 'Gym 360 & Wellness Spa', text: 'Gimnasio panorámico con vista al campo y al mar, y spa para el día a día.', image: '/paridera/hub/sunrise-gym.jpg' },
  { title: 'Beach Club & Restaurante', text: 'Servicio de playa, restaurante y palapa a pocos pasos de cada residencia.', image: '/paridera/hub/beach-palapa.jpg' },
  { title: 'Piscinas con vista al golf', text: 'Áreas de piscina abiertas al fairway de Las Iguanas.', image: '/paridera/hub/sunrise-pool.jpg' },
  { title: 'Gestión integral de alquileres', text: 'Operada por un operador de prestigio internacional, para que la residencia trabaje por ti.', image: '/paridera/hub/sunrise-lobby.jpg' },
];

export function ParideraAmenities({
  items = BONITA_BEACH_AMENITIES,
  title = (
    <>
      Vida de resort,
      <br />
      <em>todos los días</em>
    </>
  ),
  action,
}: {
  items?: AmenityItem[];
  title?: ReactNode;
  action?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  return (
    <section id="amenidades" className="pb-section pb-section--tight">
      <div className="pb-container">
        <div className="pb-dark">
          <div className="pb-head pb-head--light">
            <div>
              <Eyebrow light>Amenidades</Eyebrow>
              <h2 className="pb-h2">{title}</h2>
            </div>
            {action}
          </div>

          <div className="pb-amen">
            <ul className="pb-amen__list">
              {items.map((item, i) => (
                <li
                  key={item.title}
                  className={i === active ? 'is-active' : ''}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  tabIndex={0}
                >
                  <span className="pb-amen__num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pb-amen__media">
              {items.map((item, i) => (
                <div key={item.title} className={`pb-amen__img${i === active ? ' is-active' : ''}`}>
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Cap Cana location list ─────────────────────────────────────────────── */

export const CAP_CANA_PLACES = [
  { name: 'Playa Juanillo', note: 'La playa más famosa del país', time: '5 min' },
  { name: 'Juanillo Village', note: 'Restaurantes, galerías y boutiques', time: '3 min' },
  { name: 'Marina Cap Cana', note: 'N.º 1 del mundo según Billfish Report', time: 'Cap Cana' },
  { name: 'Punta Espada Golf', note: 'Jack Nicklaus · sede del PGA Champions Tour', time: 'Cap Cana' },
  { name: 'Los Establos', note: 'El centro ecuestre más completo del Caribe', time: 'Cap Cana' },
  { name: 'Aeropuerto Internacional de Punta Cana', note: 'Conexiones diarias con EE. UU., LATAM y Europa', time: '10 min' },
];

export function ParideraLocation() {
  return (
    <section id="cap-cana" className="pb-section">
      <div className="pb-container">
        <div className="pb-head">
          <div>
            <Eyebrow>Ubicación</Eyebrow>
            <h2 className="pb-h2">
              Cap Cana,
              <br />
              <em>a pocos minutos</em>
            </h2>
          </div>
          <p className="pb-head__aside">
            El proyecto de lujo con mayor desarrollo del país: ocho kilómetros de costa, cinco de playas de arena blanca y dos campos Jack Nicklaus.
          </p>
        </div>

        <ol className="pb-loc">
          {CAP_CANA_PLACES.map((place, i) => (
            <Reveal key={place.name} delay={i * 0.04}>
              <li className="pb-loc__row">
                <span className="pb-loc__idx">/{String(i + 1).padStart(3, '0')}</span>
                <span className="pb-loc__name">{place.name}</span>
                <span className="pb-loc__note">{place.note}</span>
                <span className="pb-loc__time">{place.time}</span>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─── Investment / payment plans ─────────────────────────────────────────── */

export function ParideraPlans({
  action,
  plans = PARIDERA_PAYMENT_PLANS,
  reservationUsd = PARIDERA_RESERVATION_USD,
  taxFacts = [
    <><strong>0%</strong> impuestos de transferencia en la compra</>,
    <><strong>0%</strong> IPI durante 15 años</>,
  ],
}: {
  /** Tax facts as stated in each development's material. */
  taxFacts?: ReactNode[];
  action?: ReactNode;
  plans?: ParideraPaymentPlan[];
  reservationUsd?: number;
}) {
  return (
    <section id="inversion" className="pb-section pb-section--tight">
      <div className="pb-container">
        <div className="pb-invest">
          <div className="pb-invest__intro">
            <Eyebrow>Inversión</Eyebrow>
            <h2 className="pb-h2">
              Una inversión
              <br />
              <em>segura y rentable</em>
            </h2>
            <ul className="pb-invest__facts">
              {taxFacts.map((fact, i) => <li key={i}>{fact}</li>)}
              <li><strong>{usd(reservationUsd)}</strong> para reservar tu unidad</li>
            </ul>
            {action && <div style={{ marginTop: 32 }}>{action}</div>}
          </div>
          <div className={`pb-plans${plans.length === 2 ? ' pb-plans--two' : ''}`}>
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.1} className="pb-plan">
                <div className="pb-plan__name">{plan.name}</div>
                <div className="pb-plan__split">{plan.split}</div>
                <p>{plan.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
