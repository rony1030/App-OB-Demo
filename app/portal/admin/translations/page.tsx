
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import TranslationWorkbench from '@/components/portal/admin/TranslationWorkbench';
import { Languages, Sparkles, BookOpen, Globe2 } from 'lucide-react';
import { supportedLocales, localeNames } from '@/lib/i18n/locale';

export const revalidate = 0;

export default async function AdminTranslationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (
    currentUser.role !== 'super_admin' &&
    currentUser.role !== 'master_broker_admin'
  ) {
    redirect('/portal');
  }

  const standardGlossary = [
    { es: 'Todos los desarrolladores', en: 'All developers', fr: 'Tous les promoteurs' },
    { es: 'Acceso Brokers', en: 'Brokers Access', fr: 'Accès Brokers' },
    { es: 'Explorar Disponibilidad', en: 'Explore Availability', fr: 'Explorer la Disponibilité' },
    { es: 'Simular Pagos', en: 'Simulate Payments', fr: 'Simulateur de Paiements' },
    { es: 'Ventas Oficiales Abiertas', en: 'Official Sales Open', fr: 'Ventes Officielles Ouvertes' },
    { es: 'Master Plan & Amenidades', en: 'Master Plan & Amenities', fr: 'Plan de masse & Équipements' },
    { es: 'Calidades & Terminaciones', en: 'Specifications & Finishes', fr: 'Finitions & Prestations' },
    { es: 'Ubicación & Conectividad', en: 'Location & Connectivity', fr: 'Emplacement & Connexion' },
    { es: 'Plan de Pago', en: 'Payment Plan', fr: 'Plan de Paiement' },
    { es: 'Rentabilidad Estimada', en: 'Estimated Profitability', fr: 'Rentabilité Estimée' },
  ];

  return (
    <div className="portal-enter space-y-8 pb-16">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-violet-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Languages className="h-4 w-4 text-violet-600" />
            <span><LocalizedText text={"Motor de Localización &amp; Diccionario Multilingüe"} /></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Traducciones &amp; Diccionario Gemini"} /></h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500"><LocalizedText text={"Gestiona las traducciones de las landing públicas (Ciprés Residences, Cana Rock, etc.), el diccionario inmobiliario y la sincronización con los modelos de Google Gemini."} /></p>
        </div>

        <div className="flex items-center gap-2">
          {supportedLocales.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs"
            >
              <Globe2 className="h-3.5 w-3.5 text-violet-600" />
              <span>{localeNames[loc]} ({loc.toUpperCase()})</span>
            </span>
          ))}
        </div>
      </section>

      {/* Main Interactive Workbench */}
      <TranslationWorkbench />

      {/* Dictionary Reference Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Diccionario Inmobiliario Sincronizado"} /></h2>
              <p className="text-xs text-slate-500"><LocalizedText text={"Términos estándar aplicados instantáneamente a las landing pages y componentes públicos."} /></p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
            <Sparkles className="h-3 w-3 text-amber-600" /><LocalizedText text={" Auto-fallback activo"} /></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3"><LocalizedText text={"Español (ES)"} /></th>
                <th className="px-4 py-3"><LocalizedText text={"English (EN)"} /></th>
                <th className="px-4 py-3"><LocalizedText text={"Français (FR)"} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {standardGlossary.map((term, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 font-semibold text-slate-900">{term.es}</td>
                  <td className="px-4 py-3 text-slate-700">{term.en}</td>
                  <td className="px-4 py-3 text-slate-700">{term.fr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
