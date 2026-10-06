'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, KeyRound, Menu, ShieldCheck, X } from 'lucide-react';
import BrandLogo from '@/components/branding/BrandLogo';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function Navbar({
  onRequestAccess,
  sessionUser,
}: {
  onRequestAccess: () => void;
  sessionUser?: { displayName: string } | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLocale();
  const initials = sessionUser?.displayName
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '';

  const navLinks = [
    { href: '#desarrollos', label: t('developments') },
    { href: '#beneficios', label: t('forBrokers') },
    { href: '#como-funciona', label: t('howItWorks') },
    { href: '#comisiones', label: t('commissionsNav') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-[1680px] items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <BrandLogo size="xl" variant="dark" className="brand-color-cycle" />
        </Link>

        {/* Center Nav Links (VistaHaven / Cyrclo Clean Style) */}
        <nav className="hidden lg:flex items-center gap-10 text-[15px] font-semibold text-slate-700">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative py-1 text-slate-700 hover:text-slate-950 transition-colors"
            >
              <span className="nav-roll-wrapper">
                <span className="nav-roll-text">{link.label}</span>
                <span className="nav-roll-text-hover text-blue-700">{link.label}</span>
              </span>
            </a>
          ))}
        </nav>

        {/* Right group: CTAs + hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PublicLanguageSwitcher circular />
          {sessionUser ? (
            <Link
              href="/portal"
              className="group inline-flex h-10 items-center gap-2.5 rounded-full bg-slate-950 pl-1.5 pr-4 text-xs font-extrabold text-white shadow-md hover:bg-blue-600 active:scale-[0.98] transition-all duration-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white">
                {initials}
              </span>
              <span><LocalizedText text={"Portal"} /></span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98] transition-all"
              >
                <KeyRound className="h-3.5 w-3.5 text-blue-700" />
                <span>{t('portalBrokers')}</span>
              </Link>
              <button
                type="button"
                onClick={onRequestAccess}
                className="hidden sm:inline-flex group relative h-10 items-center gap-2.5 rounded-full bg-slate-950 px-5 text-xs font-extrabold text-white shadow-md hover:bg-blue-600 active:scale-[0.98] transition-all duration-300"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('requestAccess')}</span>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-xs active:scale-95 transition lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-200/80 bg-white/95 px-6 py-6 shadow-xl backdrop-blur-2xl lg:hidden"
          >
            <div className="pb-3 mb-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('translations')}</span>
              <PublicLanguageSwitcher circular />
            </div>

            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-2.5 pt-4 mt-4 border-t border-slate-100">
              {sessionUser ? (
                <Link
                  href="/portal"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-slate-950 text-xs font-extrabold text-white shadow-md hover:bg-blue-600"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[9px] font-black text-white">
                    {initials}
                  </span>
                  <span><LocalizedText text={"Portal"} /></span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-blue-700" />
                    <span>{t('portalBrokers')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onRequestAccess();
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-extrabold text-white shadow-md hover:bg-blue-600"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{t('requestAccess')}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
