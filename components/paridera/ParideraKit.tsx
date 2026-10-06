'use client';

// Shared design kit for the Paridera Investors / Bonita Beach public pages:
// tokens, typography, buttons, header, footer and scroll effects.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { PARIDERA_PHASES } from '@/lib/data/paridera-portfolio';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--pb-sans' });

export const usd = (value: number) => `US$ ${value.toLocaleString('en-US')}`;

export function ParideraShell({ children, extraStyles = '' }: { children: ReactNode; extraStyles?: string }) {
  return (
    <div className={`${sans.variable} pb-root`}>
      <style>{PARIDERA_STYLES + extraStyles}</style>
      {children}
    </div>
  );
}

export function RollButton({ href, children, variant = 'sun' }: { href: string; children: string; variant?: 'sun' | 'ink' | 'ghost' }) {
  const className = `pb-btn pb-btn--${variant}`;
  const inner = (
    <>
      <span className="pb-btn__track">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
      <span className="pb-btn__icon"><ArrowUpRight size={15} strokeWidth={2} /></span>
    </>
  );
  return href.startsWith('#') ? <a href={href} className={className}>{inner}</a> : <Link href={href} className={className}>{inner}</Link>;
}

export function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return <span className={`pb-eyebrow${light ? ' pb-eyebrow--light' : ''}`}>{children}</span>;
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Header ──────────────────────────────────────────────────────────────── */

export interface ParideraNavLink {
  href: string;
  label: string;
}

export interface ParideraBrand {
  name: string;
  logo: { src: string; width: number; height: number };
  logoLight: { src: string; width: number; height: number };
  /** Footer display word, e.g. "Bonita Beach". */
  display: string;
}

export const BONITA_BEACH_BRAND: ParideraBrand = {
  name: 'Bonita Beach Luxury Residences',
  logo: { src: '/paridera/hub/logo-h-blue.png', width: 1400, height: 550 },
  logoLight: { src: '/paridera/hub/logo-h-white.png', width: 1400, height: 550 },
  display: 'Bonita Beach',
};

export const BONITA_GOLF_BRAND: ParideraBrand = {
  name: 'Bonita Golf Residences',
  logo: { src: '/paridera/golf/logo-blue.png', width: 1000, height: 421 },
  logoLight: { src: '/paridera/golf/logo-white.png', width: 1000, height: 421 },
  display: 'Bonita Golf',
};

export function ParideraHeader({
  nav,
  cta,
  brand = BONITA_BEACH_BRAND,
}: {
  nav: ParideraNavLink[];
  cta: { href: string; label: string };
  brand?: ParideraBrand;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`pb-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="pb-header__inner">
        <Link href="/desarrolladores/paridera" className="pb-header__logo" aria-label={brand.name}>
          <Image src={brand.logo.src} alt={brand.name} width={brand.logo.width} height={brand.logo.height} priority />
        </Link>
        <nav className="pb-header__nav">
          {nav.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>
        <RollButton href={cta.href} variant="ink">{cta.label}</RollButton>
      </div>
    </header>
  );
}

/* ─── Footer signature: development names written by hand, one after another ─ */

const WRITE_MS = 2600;
const HOLD_MS = 2200;

function SignatureCycle({ names }: { names: string[] }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || reduce) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % names.length), WRITE_MS + HOLD_MS);
    return () => window.clearTimeout(id);
  }, [visible, reduce, index, names.length]);

  return (
    <div ref={ref} className="pb-signature" aria-label={names.join(', ')}>
      <svg viewBox="0 0 1800 300" role="img" aria-hidden>
        <text
          key={`${index}-${visible}`}
          x="900"
          y="210"
          textAnchor="middle"
          className={visible && !reduce ? 'is-writing' : 'is-static'}
          style={{ animationDuration: `${WRITE_MS}ms, ${WRITE_MS + HOLD_MS}ms, ${WRITE_MS}ms` }}
        >
          {names[index]}
        </text>
      </svg>
    </div>
  );
}

/* ─── Scroll effects ───────────────────────────────────────────────────────── */

export function WordReveal({ text, progress, className }: { text: string; progress: MotionValue<number>; className?: string }) {
  const words = text.split(' ');
  return (
    <p className={className}>
      {words.map((word, i) => (
        <Word key={`${word}-${i}`} progress={progress} range={[i / words.length, (i + 1) / words.length]}>
          {word}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="pb-word">
      {children}{' '}
    </motion.span>
  );
}

export function ParallaxImage({ src, alt, offset = 60 }: { src: string; alt: string; offset?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  return (
    <div ref={ref} className="pb-parallax">
      <motion.div style={{ y }} className="pb-parallax__inner">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
      </motion.div>
    </div>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */

/** Full development names, starting with the one the page is about. */
function signatureNames(current?: string) {
  const names = PARIDERA_PHASES.map((p) => p.fullName);
  const start = Math.max(0, PARIDERA_PHASES.findIndex((p) => p.key === current));
  return [...names.slice(start), ...names.slice(0, start)];
}

export function ParideraFooter({ brand = BONITA_BEACH_BRAND, current }: { brand?: ParideraBrand; current?: string }) {
  return (
    <footer className="pb-footer-wrap">
      <div className="pb-container">
        <div className="pb-footer">
          <div className="pb-footer__top">
            <div className="pb-footer__brand">
              <Image src={brand.logoLight.src} alt={brand.name} width={brand.logoLight.width} height={brand.logoLight.height} />
              <p>Un desarrollo de Paridera Investors SRL en el campo de golf Las Iguanas, Cap Cana, República Dominicana.</p>
            </div>
            <div className="pb-footer__col">
              <h4>Desarrollos</h4>
              {PARIDERA_PHASES.map((phase) =>
                phase.hasLanding ? (
                  <Link key={phase.key} href={`/proyectos/${phase.slug}`}>{phase.label}</Link>
                ) : (
                  <span key={phase.key}>{phase.label}</span>
                ),
              )}
            </div>
            <div className="pb-footer__col">
              <h4>Oficina</h4>
              <span>C. Víctor Garrido Puello No. 29</span>
              <span>Piantini, Santo Domingo</span>
              <a href="https://www.bonitaresidences.luxury" target="_blank" rel="noreferrer">bonitaresidences.luxury</a>
            </div>
          </div>
          <SignatureCycle names={signatureNames(current)} />
          <div className="pb-footer__legal">
            <span>© {new Date().getFullYear()} Paridera Investors SRL</span>
            <span>Imágenes ilustrativas, sujetas a cambios. Comercializado con OB Brokers Team.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

export const PARIDERA_STYLES = `
.pb-root{--ink:#0A2A3B;--brand:#004F73;--text:#4A5D68;--muted:#8A99A3;--line:#E6EBEE;--sand:#F4F1EB;--paper:#fff;--sun:#F5C85B;--sun-deep:#E9B23A;--lagoon:#5CC8C2;
  background:var(--paper);color:var(--ink);font-family:var(--pb-sans),system-ui,sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip}
.pb-root em{font-family:var(--font-display),Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-0.01em}
.pb-container{width:100%;max-width:1440px;margin:0 auto;padding:0 clamp(16px,3.6vw,56px)}
.pb-section{padding:clamp(80px,9vw,140px) 0}
.pb-section--tight{padding:clamp(24px,3vw,40px) 0}
.pb-h2{font-size:clamp(2.3rem,4.4vw,4.4rem);line-height:1.02;font-weight:500;letter-spacing:-0.035em;margin:18px 0 0}
.pb-eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:13px;font-weight:500;color:var(--brand);letter-spacing:0.02em}
.pb-eyebrow::before{content:"";width:28px;height:1px;background:currentColor}
.pb-eyebrow--light{color:rgba(255,255,255,.75)}
.pb-head{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;margin-bottom:clamp(40px,5vw,72px);flex-wrap:wrap}
.pb-head__aside{max-width:380px;color:var(--text);margin:0}
.pb-head--light{color:#fff}

/* buttons */
.pb-btn{display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 6px 0 22px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap;transition:background .4s,color .4s,transform .4s}
.pb-btn__track{display:grid;height:20px;overflow:hidden;line-height:20px}
.pb-btn__track span{grid-area:1/1;transition:transform .55s cubic-bezier(.22,1,.36,1)}
.pb-btn__track span+span{transform:translateY(110%)}
.pb-btn:hover .pb-btn__track span:first-child{transform:translateY(-110%)}
.pb-btn:hover .pb-btn__track span+span{transform:translateY(0)}
.pb-btn__icon{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;transition:transform .55s cubic-bezier(.22,1,.36,1)}
.pb-btn:hover .pb-btn__icon{transform:rotate(45deg)}
.pb-btn--sun{background:var(--sun);color:var(--ink)}
.pb-btn--sun .pb-btn__icon{background:var(--ink);color:var(--sun)}
.pb-btn--sun:hover{background:#fff}
.pb-btn--ink{background:var(--ink);color:#fff}
.pb-btn--ink .pb-btn__icon{background:var(--sun);color:var(--ink)}
.pb-btn--ink:hover{background:var(--brand)}
.pb-btn--ghost{background:rgba(255,255,255,.12);color:#fff;backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}
.pb-btn--ghost .pb-btn__icon{background:#fff;color:var(--ink)}
.pb-btn--ghost:hover{background:rgba(255,255,255,.22)}

/* header */
.pb-header{position:fixed;inset:0 0 auto 0;z-index:80;transition:background .4s,box-shadow .4s}
.pb-header.is-scrolled{background:rgba(255,255,255,.88);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--line)}
.pb-header__inner{max-width:1440px;margin:0 auto;padding:0 clamp(16px,3.6vw,56px);height:84px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.pb-header__logo{display:block;width:150px}
.pb-header__logo img{width:100%;height:auto;display:block}
.pb-header__nav{display:flex;gap:36px}
.pb-header__nav a{font-size:14px;color:var(--ink);text-decoration:none;position:relative}
.pb-header__nav a::after{content:"";position:absolute;left:0;bottom:-4px;height:1px;width:100%;background:currentColor;transform:scaleX(0);transform-origin:right;transition:transform .45s cubic-bezier(.22,1,.36,1)}
.pb-header__nav a:hover::after{transform:scaleX(1);transform-origin:left}

/* hero */
.pb-hero{padding:84px clamp(16px,3.6vw,56px) 0}
.pb-hero__frame{position:relative;height:calc(100svh - 104px);min-height:620px;max-height:980px;border-radius:20px;overflow:hidden;background:var(--ink);isolation:isolate}
.pb-hero__slide{position:absolute;inset:0;opacity:0;transition:opacity 1.6s ease}
.pb-hero__slide img{transform:scale(1.12);transition:transform 7.5s linear}
.pb-hero__slide.is-active{opacity:1}
.pb-hero__slide.is-active img{transform:scale(1)}
.pb-hero__shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,28,40,.55) 0%,rgba(6,28,40,.05) 38%,rgba(6,28,40,.1) 60%,rgba(6,28,40,.6) 100%)}
.pb-hero__content{position:absolute;top:clamp(32px,5vw,72px);left:clamp(20px,4vw,64px);right:20px;color:#fff;z-index:2}
.pb-hero__content h1{font-size:clamp(2.2rem,3.9vw,4rem);line-height:1.05;font-weight:500;letter-spacing:-0.035em;margin:0;max-width:760px;text-wrap:balance}
.pb-hero__actions{display:flex;gap:12px;flex-wrap:wrap}
.pb-hero__bottom{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:0 clamp(20px,4vw,64px) clamp(20px,3vw,40px);z-index:2;overflow:hidden}
.pb-hero__intro{max-width:460px;color:#fff}
.pb-hero__intro p{margin:0 0 22px;font-size:17px;line-height:1.5;opacity:.9}
.pb-hero__card-wrap{flex-shrink:0}
.pb-hero__card{position:relative;display:flex;gap:14px;align-items:center;width:360px;padding:10px;border-radius:16px;background:rgba(255,255,255,.14);backdrop-filter:blur(16px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);color:#fff;text-decoration:none;overflow:hidden;transition:background .4s}
a.pb-hero__card:hover{background:rgba(255,255,255,.22)}
.pb-hero__card-copy{flex:1;min-width:0;min-height:58px;display:flex;align-items:center}
.pb-hero__card-img-inner{position:absolute;inset:0}
.pb-hero__card-progress{position:absolute;left:16px;right:16px;bottom:5px;height:2px;border-radius:2px;background:rgba(255,255,255,.18);overflow:hidden}
.pb-hero__card-progress span{display:block;height:100%;width:0;background:#fff}
.pb-hero__card-progress span.is-running{animation:pb-progress linear forwards}
.pb-hero__card-img{position:relative;width:96px;height:80px;border-radius:10px;overflow:hidden;flex-shrink:0}
.pb-hero__card-title{font-weight:600;font-size:15px}
.pb-hero__card p{margin:2px 0 0;font-size:13px;line-height:1.45;opacity:.85}
.pb-hero__dots{position:absolute;right:clamp(20px,4vw,64px);top:clamp(36px,5vw,76px);display:flex;gap:8px;z-index:3}
.pb-hero__dots button{width:44px;height:3px;border:0;padding:0;border-radius:3px;background:rgba(255,255,255,.3);cursor:pointer;overflow:hidden}
.pb-hero__dots span{display:block;height:100%;width:0;background:#fff}
.pb-hero__dots .is-active span{animation:pb-progress 6s linear forwards}
@keyframes pb-progress{to{width:100%}}

/* intro */
.pb-intro__grid{display:grid;grid-template-columns:1fr 2.2fr;gap:48px}
.pb-intro__statement{font-size:clamp(1.7rem,3vw,3rem);line-height:1.14;font-weight:500;letter-spacing:-0.03em;margin:0}
.pb-word{display:inline}
.pb-intro__lead{max-width:560px;color:var(--text);margin:32px 0 0;font-size:17px}
.pb-intro__trio{display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:16px;margin-top:clamp(56px,7vw,96px);align-items:end}
.pb-parallax{position:relative;height:clamp(260px,30vw,440px);border-radius:16px;overflow:hidden}
.pb-intro__trio .pb-parallax:nth-child(2){height:clamp(320px,38vw,560px)}
.pb-parallax__inner{position:absolute;inset:-100px 0}
.pb-stats{display:grid;grid-template-columns:repeat(4,1fr);margin-top:clamp(56px,6vw,88px);border-top:1px solid var(--line)}
.pb-stat{padding:28px 24px 0 0}
.pb-stat+.pb-stat{padding-left:24px;border-left:1px solid var(--line)}
.pb-stat__value{font-size:clamp(2.2rem,3.6vw,3.6rem);font-weight:500;letter-spacing:-0.04em;line-height:1}
.pb-stat__value span{font-size:.42em;margin-left:6px;color:var(--brand);letter-spacing:0}
.pb-stat__label{color:var(--text);font-size:14px;margin-top:10px}

/* marquee */
.pb-marquee{overflow:hidden;border-block:1px solid var(--line);padding:26px 0;background:var(--sand)}
.pb-marquee__track{display:flex;width:max-content;animation:pb-marquee 48s linear infinite}
.pb-marquee__item{display:inline-flex;align-items:center;gap:40px;padding-right:40px;font-family:var(--font-display),Georgia,serif;font-style:italic;font-size:clamp(1.6rem,2.6vw,2.6rem);color:var(--ink);white-space:nowrap}
.pb-marquee__item i{font-style:normal;font-size:.5em;color:var(--sun-deep)}
@keyframes pb-marquee{to{transform:translateX(-33.333%)}}

/* portfolio */
.pb-portfolio__grid{display:grid;grid-template-columns:1.05fr 1fr;gap:clamp(32px,5vw,88px)}
.pb-portfolio__sticky{position:sticky;top:104px;height:calc(100svh - 136px);max-height:820px}
.pb-portfolio__frame{position:relative;height:100%;border-radius:20px;overflow:hidden;background:var(--sand)}
.pb-portfolio__img{position:absolute;inset:0;clip-path:inset(100% 0 0 0);transition:clip-path 1.1s cubic-bezier(.76,0,.24,1)}
.pb-portfolio__img img{transform:scale(1.15);transition:transform 1.6s cubic-bezier(.22,1,.36,1)}
.pb-portfolio__img.is-active,.pb-portfolio__img.is-past{clip-path:inset(0 0 0 0)}
.pb-portfolio__img.is-active{z-index:2}
.pb-portfolio__img.is-active img{transform:scale(1)}
.pb-portfolio__frame::after{content:"";position:absolute;inset:auto 0 0 0;height:40%;background:linear-gradient(transparent,rgba(6,28,40,.55));z-index:2;pointer-events:none}
.pb-portfolio__tag{position:absolute;left:28px;bottom:24px;z-index:3;color:#fff;font-size:15px;font-weight:500}
.pb-phase{min-height:88svh;display:flex;flex-direction:column;justify-content:center;padding:48px 0;border-bottom:1px solid var(--line)}
.pb-phase:last-child{border-bottom:0}
.pb-phase__mobile-img{display:none}
.pb-phase__count{font-size:14px;font-weight:600;color:var(--brand)}
.pb-phase__count span{color:var(--muted);font-weight:400}
.pb-phase__label{margin-top:28px;font-size:14px;color:var(--text)}
.pb-phase__name{font-size:clamp(3rem,6vw,6rem);line-height:.95;font-weight:500;letter-spacing:-0.05em;margin:6px 0 20px}
.pb-phase__summary{color:var(--text);font-size:17px;max-width:520px;margin:0 0 32px}
.pb-phase__availability{padding:24px;border-radius:16px;background:var(--sand);margin-bottom:28px}
.pb-phase__avail-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
.pb-phase__avail-num{font-size:3.4rem;font-weight:500;letter-spacing:-0.05em;line-height:.9}
.pb-phase__avail-cap{font-size:14px;color:var(--text);margin-top:6px}
.pb-phase__from{text-align:right;font-size:20px;font-weight:600;letter-spacing:-0.02em}
.pb-phase__from span{display:block;font-size:12px;font-weight:500;color:var(--muted);letter-spacing:.02em}
.pb-bar{position:relative;height:6px;border-radius:6px;background:rgba(10,42,59,.1);margin:22px 0 12px;overflow:hidden}
.pb-bar__fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--brand),var(--lagoon));border-radius:6px}
.pb-phase__legend{display:flex;gap:18px;flex-wrap:wrap;font-size:12.5px;color:var(--muted)}
.pb-phase__meta-title{font-size:12.5px;font-weight:600;color:var(--muted);letter-spacing:.04em}
.pb-phase__meta p{margin:4px 0 18px;font-weight:500}
.pb-phase__amenities{list-style:none;padding:0;margin:0 0 32px;display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}
.pb-phase__amenities li{display:flex;gap:8px;align-items:center;font-size:14.5px;color:var(--ink)}
.pb-phase__amenities svg{color:var(--sun-deep);flex-shrink:0}
.pb-phase .pb-btn{align-self:flex-start}
.pb-phase__soon{align-self:flex-start;font-size:14px;color:var(--muted);padding:12px 0;border-bottom:1px dashed var(--line)}

/* amenities dark */
.pb-dark{background:var(--ink);color:#fff;border-radius:24px;padding:clamp(32px,5vw,80px)}
.pb-amen{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,80px);align-items:stretch}
.pb-amen__list{list-style:none;margin:0;padding:0}
.pb-amen__list li{display:grid;grid-template-columns:74px 1fr;gap:12px;padding:22px 0;border-top:1px solid rgba(255,255,255,.12);cursor:default;outline:none;transition:opacity .4s}
.pb-amen__list li:last-child{border-bottom:1px solid rgba(255,255,255,.12)}
.pb-amen__num{font-family:var(--font-signature-dancing),'Brush Script MT',cursive;font-size:30px;font-weight:600;line-height:1;color:rgba(255,255,255,.35);transition:color .4s}
.pb-amen__list h3{margin:0;font-size:clamp(1.3rem,2vw,1.9rem);font-weight:500;letter-spacing:-0.025em;transition:color .4s,transform .5s cubic-bezier(.22,1,.36,1)}
.pb-amen__list p{margin:0;max-height:0;opacity:0;overflow:hidden;color:rgba(255,255,255,.65);font-size:15px;transition:max-height .6s cubic-bezier(.22,1,.36,1),opacity .4s,margin .4s}
.pb-amen__list li.is-active h3{color:var(--sun);transform:translateX(8px)}
.pb-amen__list li.is-active p{max-height:80px;opacity:1;margin-top:8px;transform:translateX(8px)}
.pb-amen__list li.is-active .pb-amen__num{color:#fff}
.pb-amen__media{position:relative;min-height:440px;border-radius:16px;overflow:hidden}
.pb-amen__img{position:absolute;inset:0;opacity:0;transform:scale(1.06);transition:opacity .7s ease,transform 1.2s cubic-bezier(.22,1,.36,1)}
.pb-amen__img.is-active{opacity:1;transform:scale(1)}

/* statement */
.pb-statement{position:relative;height:240svh}
.pb-statement__sticky{position:sticky;top:0;height:100svh;display:grid;place-items:center;overflow:hidden}
.pb-statement__bg{position:absolute;inset:0;overflow:hidden}
.pb-statement__shade{position:absolute;inset:0;background:rgba(6,28,40,.55)}
.pb-statement__text{position:relative;z-index:2;max-width:1100px;padding:0 24px;text-align:center}
.pb-statement__quote{font-family:var(--font-display),Georgia,serif;font-size:clamp(2rem,4.6vw,4.6rem);line-height:1.1;letter-spacing:-0.02em;color:#fff;margin:0}

/* location */
.pb-loc{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.pb-loc__row{position:relative;display:grid;grid-template-columns:90px 1.3fr 1.4fr 120px;align-items:center;gap:24px;padding:28px 12px;border-bottom:1px solid var(--line);overflow:hidden;isolation:isolate}
.pb-loc__row::before{content:"";position:absolute;inset:0;background:var(--sand);transform:scaleY(0);transform-origin:bottom;transition:transform .6s cubic-bezier(.22,1,.36,1);z-index:-1}
.pb-loc__row:hover::before{transform:scaleY(1)}
.pb-loc__idx{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.pb-loc__name{font-size:clamp(1.3rem,2.2vw,2.1rem);font-weight:500;letter-spacing:-0.03em;transition:transform .5s cubic-bezier(.22,1,.36,1)}
.pb-loc__row:hover .pb-loc__name{transform:translateX(10px)}
.pb-loc__note{color:var(--text);font-size:15px}
.pb-loc__time{text-align:right;font-weight:600;color:var(--brand)}

/* investment */
.pb-invest{display:grid;grid-template-columns:1fr 1.4fr;gap:clamp(32px,5vw,80px);background:var(--sand);border-radius:24px;padding:clamp(32px,5vw,80px)}
.pb-invest__facts{list-style:none;padding:0;margin:40px 0 0}
.pb-invest__facts li{padding:16px 0;border-top:1px solid rgba(10,42,59,.12);color:var(--text)}
.pb-invest__facts strong{color:var(--ink);font-weight:600;margin-right:8px}
.pb-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-content:end;align-items:stretch}
.pb-plans--two{grid-template-columns:repeat(2,1fr)}
.pb-plan{background:#fff;border-radius:16px;padding:28px 24px;display:flex;flex-direction:column;height:100%;min-height:260px;transition:transform .5s cubic-bezier(.22,1,.36,1),box-shadow .5s}
.pb-plan:hover{transform:translateY(-6px);box-shadow:0 30px 60px -30px rgba(10,42,59,.35)}
.pb-plan__name{font-size:13px;font-weight:600;color:var(--brand)}
.pb-plan__split{font-size:clamp(1.5rem,1.9vw,2rem);font-weight:500;letter-spacing:-0.03em;margin:44px 0 14px;line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums}
.pb-plan p{margin:0;font-size:14px;color:var(--text)}

/* cta */
.pb-cta{position:relative;min-height:clamp(520px,60vw,760px);border-radius:24px;overflow:hidden;display:flex;align-items:flex-end;isolation:isolate}
.pb-cta__shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,28,40,.78) 0%,rgba(6,28,40,.25) 60%,rgba(6,28,40,.05) 100%)}
.pb-cta__wipe{position:absolute;inset:0;background:var(--sun);transform-origin:top;z-index:3}
.pb-cta__content{position:relative;z-index:2;color:#fff;max-width:640px;padding:clamp(28px,5vw,72px)}
.pb-cta__content p{font-size:17px;opacity:.85;margin:20px 0 32px;max-width:480px}

/* footer */
.pb-footer-wrap{padding-top:clamp(24px,3vw,40px)}
.pb-footer{background:var(--ink);color:#fff;border-radius:24px 24px 0 0;padding:clamp(40px,5vw,72px) clamp(24px,4vw,64px) 28px;overflow:hidden}
.pb-footer__top{display:grid;grid-template-columns:2fr 1fr 1fr;gap:48px}
.pb-footer__brand img{width:220px;height:auto}
.pb-footer__brand p{color:rgba(255,255,255,.6);max-width:380px;margin:24px 0 0;font-size:15px}
.pb-footer__col{display:flex;flex-direction:column;gap:10px;font-size:15px}
.pb-footer__col h4{margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.14);font-family:var(--font-display),Georgia,serif;font-style:italic;font-size:22px;font-weight:400;letter-spacing:-0.01em;color:#fff}
.pb-footer__col a,.pb-footer__col span{color:rgba(255,255,255,.75);text-decoration:none}
.pb-footer__col a:hover{color:#fff}
.pb-signature{margin:clamp(40px,6vw,80px) auto 12px;max-width:1240px}
.pb-signature svg{display:block;width:100%;height:auto;overflow:visible}
.pb-signature text{font-family:var(--font-signature-dancing),'Brush Script MT',cursive;font-size:172px;font-weight:600;fill:#fff;stroke:#fff;stroke-width:1.4px;stroke-linecap:round;stroke-linejoin:round;paint-order:stroke}
.pb-signature text.is-writing{stroke-dasharray:3200;stroke-dashoffset:3200;fill-opacity:0;animation-name:pb-sign-stroke,pb-sign-fill,pb-sign-wipe;animation-timing-function:cubic-bezier(.55,.1,.3,1),linear,cubic-bezier(.45,.05,.35,1);animation-fill-mode:forwards,forwards,forwards}
.pb-signature text.is-static{stroke-width:0}
@keyframes pb-sign-stroke{to{stroke-dashoffset:0}}
@keyframes pb-sign-wipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 -5% 0 0)}}
@keyframes pb-sign-fill{0%,45%{fill-opacity:0}70%{fill-opacity:1}90%{fill-opacity:1;opacity:1}100%{fill-opacity:1;opacity:0}}
.pb-footer__legal{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:20px;border-top:1px solid rgba(255,255,255,.1);font-size:13px;color:rgba(255,255,255,.5)}

@media (max-width:1024px){
  .pb-header__nav{display:none}
  .pb-portfolio__grid{grid-template-columns:1fr}
  .pb-portfolio__sticky{display:none}
  .pb-phase{min-height:auto;padding:40px 0}
  .pb-phase__mobile-img{display:block;position:relative;aspect-ratio:4/3;border-radius:16px;overflow:hidden;margin-bottom:24px}
  .pb-amen,.pb-invest{grid-template-columns:1fr}
  .pb-amen__media{min-height:320px;order:-1}
  .pb-plans{grid-template-columns:1fr}
  .pb-plan{min-height:auto}
  .pb-plan__split{margin:20px 0 12px}
}
@media (max-width:768px){
  .pb-header__logo{width:120px}
  .pb-header .pb-btn{height:42px;padding-left:16px;font-size:13px}
  .pb-header .pb-btn__icon{width:30px;height:30px}
  .pb-hero__card{display:none}
  .pb-intro__grid{grid-template-columns:1fr;gap:20px}
  .pb-intro__trio{grid-template-columns:1fr}
  .pb-intro__trio .pb-parallax:not(:nth-child(2)){display:none}
  .pb-stats{grid-template-columns:1fr 1fr}
  .pb-stat:nth-child(3){padding-left:0;border-left:0}
  .pb-stat{padding-bottom:24px}
  .pb-phase__amenities{grid-template-columns:1fr}
  .pb-loc__row{grid-template-columns:56px 1fr auto;gap:12px}
  .pb-loc__note{display:none}
  .pb-footer__top{grid-template-columns:1fr}
  .pb-statement{height:180svh}
}
@media (prefers-reduced-motion:reduce){
  .pb-marquee__track,.pb-hero__dots .is-active span{animation:none}
  .pb-hero__slide img,.pb-portfolio__img,.pb-portfolio__img img{transition:none}
}
`;
