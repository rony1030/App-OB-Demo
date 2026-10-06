'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';

export interface HeroCarouselImage {
  src: string;
  alt: string;
}

// Ambient placeholder for orgs that haven't uploaded project photography yet
// — a licensed stock Caribbean aerial (Unsplash), swapped out automatically
// once `images` carries real project photos.
const FALLBACK_IMAGE: HeroCarouselImage = {
  src: 'https://images.unsplash.com/photo-1618064541372-289bdb6f5b7b?w=1920&q=80&auto=format&fit=crop',
  alt: 'Vista aérea de una playa caribeña',
};

export default function HeroCarousel({ images }: { images: HeroCarouselImage[] }) {
  const { autoTranslate } = useLocale();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const gallery = images.length > 0 ? images : [FALLBACK_IMAGE];

  useEffect(() => {
    if (gallery.length < 2 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % gallery.length), 4500);
    return () => window.clearInterval(id);
  }, [gallery.length, paused]);

  const current = gallery[index] ?? gallery[0];

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-black/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        {gallery.map((img, i) =>
          i === index ? (
            <motion.div
              key={`${img.src}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <motion.img
                src={img.src}
                alt={img.alt}
                initial={{ scale: 1 }}
                animate={{ scale: 1.12 }}
                transition={{ duration: 4.5, ease: 'linear' }}
                className="h-full w-full object-cover"
              />
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

      <div className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-md backdrop-blur">
        {images.length > 0 ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800">{autoTranslate('Inventario en vivo')}</span>
          </>
        ) : (
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800">{autoTranslate('Caribe · República Dominicana')}</span>
        )}
      </div>

      <div className="absolute bottom-14 left-5 right-5 text-white">
        <AnimatePresence mode="wait">
          <motion.p
            key={current.alt + index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-black leading-tight drop-shadow-sm"
          >
            {autoTranslate(current.alt)}
          </motion.p>
        </AnimatePresence>
      </div>

      {gallery.length > 1 && (
        <div className="absolute bottom-5 left-5 right-5 flex items-center gap-1.5">
          {gallery.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${autoTranslate('Ver imagen')} ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
