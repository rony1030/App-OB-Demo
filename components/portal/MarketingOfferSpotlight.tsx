'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { ArrowRight, BadgePercent, Megaphone, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { MarketingOffer } from '@/lib/data/marketing-offers';
import { cn } from '@/lib/utils';

function offerLabel(offer: MarketingOffer) {
  return offer.offerType === 'discount' ? `${offer.discountPercent}% de descuento autorizado` : offer.promotionText || offer.description;
}

function OfferIcon({ offer, className }: { offer: MarketingOffer; className?: string }) {
  const Icon = offer.offerType === 'discount' ? BadgePercent : Megaphone;
  return <Icon className={className} />;
}

export default function MarketingOfferSpotlight({ offers }: { offers: MarketingOffer[] }) {
  const headerOffer = offers.find((offer) => offer.displayPlacement === 'header_banner');
  const sideOffer = offers.find((offer) => offer.displayPlacement === 'side_card');
  const modalOffer = useMemo(
    () => offers.find((offer) => offer.displayPlacement === 'fullscreen') || offers.find((offer) => offer.displayPlacement === 'popup'),
    [offers],
  );
  const [openModalId, setOpenModalId] = useState<number | null>(null);

  useEffect(() => {
    if (!modalOffer) return;
    const storageKey = `ob_marketing_offer_seen_${modalOffer.id}`;
    if (window.sessionStorage.getItem(storageKey)) return;
    const timer = window.setTimeout(() => setOpenModalId(modalOffer.id), 0);
    return () => window.clearTimeout(timer);
  }, [modalOffer]);

  function dismissModal() {
    if (modalOffer) window.sessionStorage.setItem(`ob_marketing_offer_seen_${modalOffer.id}`, '1');
    setOpenModalId(null);
  }

  if (!headerOffer && !sideOffer && !modalOffer) return null;

  return (
    <>
      {headerOffer && (
        <section className="mb-5 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-950 to-blue-800 text-white shadow-sm">
          <div className="flex min-h-20 items-stretch">
            {headerOffer.bannerUrl && <div className="relative hidden w-52 shrink-0 sm:block"><UITranslationBoundary attributes={["alt"]}><Image src={headerOffer.bannerUrl} alt="" fill sizes="208px" className="object-cover" /></UITranslationBoundary></div>}
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 sm:px-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-amber-300"><OfferIcon offer={headerOffer} className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-blue-200"><LocalizedText text={"Beneficio vigente"} /></p>
                <p className="truncate text-sm font-extrabold">{headerOffer.title}</p>
                <p className="line-clamp-1 text-xs text-blue-100/80">{offerLabel(headerOffer)}</p>
              </div>
              <Link href="/portal/projects" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-[11px] font-extrabold text-blue-950 transition hover:bg-blue-50"><LocalizedText text={"Ver proyectos "} /><ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {sideOffer && (
        <aside className="mb-5 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm xl:fixed xl:bottom-5 xl:right-5 xl:z-20 xl:mb-0 xl:w-72">
          {sideOffer.bannerUrl && <div className="relative aspect-[16/6] bg-slate-100"><UITranslationBoundary attributes={["alt"]}><Image src={sideOffer.bannerUrl} alt="" fill sizes="288px" className="object-cover" /></UITranslationBoundary></div>}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><OfferIcon offer={sideOffer} className="h-4 w-4" /></span>
              <div className="min-w-0"><p className="text-sm font-extrabold text-slate-950">{sideOffer.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{offerLabel(sideOffer)}</p></div>
            </div>
            <Link href="/portal/projects" className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-blue-700 hover:text-blue-900"><LocalizedText text={"Usar en una propuesta "} /><ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </aside>
      )}

      {modalOffer && openModalId === modalOffer.id && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="marketing-offer-title">
          <section className={cn('relative w-full overflow-hidden bg-white shadow-2xl', modalOffer.displayPlacement === 'fullscreen' ? 'max-h-[calc(100vh-2rem)] max-w-5xl rounded-3xl' : 'max-w-lg rounded-2xl')}>
            <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={dismissModal} aria-label="Cerrar promoción" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white hover:text-slate-950"><X className="h-5 w-5" /></button></UITranslationBoundary>
            {modalOffer.bannerUrl && <div className={cn('relative bg-slate-100', modalOffer.displayPlacement === 'fullscreen' ? 'aspect-[16/7]' : 'aspect-[16/8]')}><UITranslationBoundary attributes={["alt"]}><Image src={modalOffer.bannerUrl} alt="" fill priority sizes={modalOffer.displayPlacement === 'fullscreen' ? '1024px' : '512px'} className="object-cover" /></UITranslationBoundary></div>}
            <div className="p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700"><OfferIcon offer={modalOffer} className="h-3.5 w-3.5" /><LocalizedText text={"Beneficio vigente"} /></span>
              <h2 id="marketing-offer-title" className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{modalOffer.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{offerLabel(modalOffer)}</p>
              {modalOffer.description && modalOffer.description !== offerLabel(modalOffer) && <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">{modalOffer.description}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/portal/projects" onClick={dismissModal} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white transition hover:bg-blue-700"><LocalizedText text={"Ver proyectos participantes "} /><ArrowRight className="h-4 w-4" /></Link>
                <button type="button" onClick={dismissModal} className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-bold text-slate-600 hover:bg-slate-50"><LocalizedText text={"Ver después"} /></button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
