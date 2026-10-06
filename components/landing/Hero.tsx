'use client';

import { motion } from 'framer-motion';
import Image from '@/components/ui/OptimizedImage';
import { ArrowUpRight, Building2, Star } from 'lucide-react';
import type { MarketingStats } from '@/lib/data/marketing';
import type { PortalProject } from '@/lib/portal-projects';
import AnimatedCounter from '@/components/landing/AnimatedCounter';
import { useLocale } from '@/components/i18n/LocaleProvider';

const brokerAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
];

function BrokerProof({ onCanvas = false }: { onCanvas?: boolean }) {
  const { t } = useLocale();
  return (
    <div className={`flex items-center gap-3.5 ${onCanvas ? 'text-slate-950' : 'text-white'}`}>
      <div className="flex -space-x-2.5" aria-hidden="true">
        {brokerAvatars.map((src) => (
          <Image
            key={src}
            className={`h-9 w-9 rounded-full object-cover ring-2 ${onCanvas ? 'ring-[var(--landing-canvas)]' : 'ring-slate-900/80'}`}
            src={src}
            width={36}
            height={36}
            alt=""
          />
        ))}
      </div>
      <div className="min-w-0 text-[11px] leading-tight">
        <p className="font-extrabold">{t('activeBrokers')}</p>
        <div className={`mt-1 flex items-center gap-1 font-bold ${onCanvas ? 'text-amber-700' : 'text-amber-300'}`}>
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className="h-2.5 w-2.5 fill-current" strokeWidth={1.5} />
            ))}
          </span>
          <span>{t('ratingCount')}</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero({
  stats,
  projects,
  onRequestAccess,
}: {
  stats: MarketingStats;
  projects: PortalProject[];
  onRequestAccess: () => void;
}) {
  const { t } = useLocale();
  return (
    <section className="relative w-full overflow-hidden bg-[var(--landing-canvas)] pb-6 pt-24 [--landing-canvas:#FAF9F6] sm:pb-12 sm:pt-28">
      <div className="w-full px-3 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
        <svg aria-hidden="true" className="absolute h-0 w-0">
          <defs>
            <clipPath id="hero-broker-cutout" clipPathUnits="objectBoundingBox">
              <path d="M .026 0 H .974 C .989 0 1 .02 1 .044 V .85 C 1 .875 .99 .89 .975 .89 H .785 C .77 .89 .758 .91 .758 .934 V .956 C .758 .981 .746 1 .731 1 H .026 C .011 1 0 .98 0 .956 V .044 C 0 .02 .011 0 .026 0 Z" />
            </clipPath>
          </defs>
        </svg>

        <div className="relative min-h-[640px] w-full sm:min-h-[720px] lg:min-h-[820px]">
          {/* The shadow follows the clipped silhouette instead of the old rectangular card. */}
          <div className="pointer-events-none absolute inset-0 2xl:[filter:drop-shadow(0_30px_55px_rgba(15,23,42,0.18))]">
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.12)] sm:rounded-[3rem] 2xl:rounded-none 2xl:shadow-none 2xl:[clip-path:url(#hero-broker-cutout)]">
              <video
                autoPlay
                loop
                muted
                playsInline
                poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&q=85&auto=format&fit=crop"
                className="absolute inset-0 h-full w-full scale-105 object-cover"
              >
                <source
                  src="https://cdn.coverr.co/videos/coverr-waves-reaching-the-shore-5573/1080p.mp4"
                  type="video/mp4"
                />
                <source
                  src="https://cdn.coverr.co/videos/coverr-sunset-on-the-beach-5309/1080p.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-slate-950/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/15" />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[640px] flex-col justify-between p-6 text-white sm:min-h-[720px] sm:p-12 lg:min-h-[820px] lg:p-[4.5rem]">

          {/* Top Tagline Badge */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md shadow-sm"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-100">
                {t('heroBadge')}
              </span>
            </motion.div>
          </div>

          {/* Main Hero Content (Clean & High-Contrast 2-Line Editorial Headline) */}
          <div className="relative z-10 max-w-3xl sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl my-auto py-8 sm:py-12 space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] font-extrabold tracking-tight text-white leading-[1.08] uppercase"
            >
              <span className="block">{t('heroTitleLine1')}</span>
              <span className="block text-white/95">{t('heroTitleLine2')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-normal"
            >
              {t('heroSubtitle')}
            </motion.p>

            {/* CTAs in VistaHaven Clean Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-3.5 pt-2"
            >
              <button
                type="button"
                onClick={onRequestAccess}
                className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-2xl hover:bg-slate-100 active:scale-[0.98] transition-all"
              >
                <span>{t('requestPortalAccess')}</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </button>

              <a
                href="#desarrollos"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-6 py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-white/20 active:scale-[0.98] transition-all"
              >
                <Building2 className="h-4 w-4" />
                <span>{t('exploreDevelopments')}</span>
              </a>
            </motion.div>

            {/* In compact layouts the proof stays in the reading flow and on the hero surface. */}
            <div className="border-t border-white/20 pt-4 2xl:hidden">
              <BrokerProof />
            </div>
          </div>

          {/* Bottom Left Metrics (Spacious VistaHaven / Altnest Counters) */}
          <div className="relative z-10 flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 sm:gap-x-14 lg:gap-x-20 2xl:max-w-[72%] 2xl:flex-nowrap">
            <div className="space-y-0.5 whitespace-nowrap">
              <div className="font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight flex items-baseline">
                <AnimatedCounter target={100} suffix="%" />
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {t('whiteLabel')}
              </p>
            </div>

            <div className="space-y-0.5 whitespace-nowrap">
              <div className="font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight flex items-baseline">
                <AnimatedCounter target={180} suffix={t('daysSuffix')} />
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {t('clientCustody')}
              </p>
            </div>

            <div className="space-y-0.5 whitespace-nowrap">
              <div className="font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                24/7
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {t('liveInventory')}
              </p>
            </div>
          </div>
          </div>

          {/* On wide screens this is a sibling placed in the real cutout, on the page canvas. */}
          <div className="absolute bottom-0 right-0 z-20 hidden h-[11%] w-[24%] items-center justify-center px-5 2xl:flex">
            <BrokerProof onCanvas />
          </div>
        </div>
      </div>
    </section>
  );
}
