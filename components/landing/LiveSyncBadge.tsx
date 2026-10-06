'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';

const STATUS_MESSAGES = [
  'Disponibilidad en Tiempo Real',
  'Unidad 302: Bloqueada en vivo',
  'Sincronizado con Google Sheets',
  'Precios & Disponibilidad actualizados',
];

export default function LiveSyncBadge() {
  const { autoTranslate } = useLocale();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3.5">
      {/* Animated Mini Checklist Icon Block */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 p-2 shadow-lg ring-1 ring-white/10 overflow-hidden">
        {/* Subtle glowing background inside icon */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />

        {/* 3 Animated Checklist Rows */}
        <div className="relative flex flex-col gap-1.5 w-full">
          {/* Row 1: Struck through & Checked */}
          <div className="flex items-center gap-1.5 w-full">
            <motion.div
              animate={{
                backgroundColor: step % 2 === 0 ? '#10b981' : '#3b82f6',
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 0.4 }}
              className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] bg-emerald-500 text-slate-950"
            >
              <svg className="h-2 w-2 text-slate-950 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="absolute inset-0 bg-slate-600"
              />
            </div>
          </div>

          {/* Row 2: Animates checking & crossing off */}
          <div className="flex items-center gap-1.5 w-full">
            <motion.div
              animate={{
                backgroundColor: step % 2 === 1 ? '#10b981' : '#334155',
                scale: step % 2 === 1 ? [0.9, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.4 }}
              className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] bg-slate-700 text-slate-950"
            >
              {step % 2 === 1 && (
                <svg className="h-2 w-2 text-slate-950 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </motion.div>
            <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: step % 2 === 1 ? '100%' : '50%' }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-slate-500"
              />
            </div>
          </div>

          {/* Row 3: New item sliding in & active */}
          <div className="flex items-center gap-1.5 w-full">
            <motion.div
              key={step}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-3 w-3 shrink-0 rounded-[3px] border border-blue-400 bg-blue-500/20"
            />
            <div className="relative h-1.5 w-3/4 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                key={`bar-${step}`}
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 bg-blue-400/80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Text Ticker beside icon */}
      <div className="min-w-[190px]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{autoTranslate('Sincronización Directa')}</p>
        </div>
        <div className="h-5 overflow-hidden relative mt-0.5">
          <AnimatePresence mode="wait">
            <motion.p
              key={STATUS_MESSAGES[step]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-xs font-black text-slate-900 truncate"
            >
              {autoTranslate(STATUS_MESSAGES[step])}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
