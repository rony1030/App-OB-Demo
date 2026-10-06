'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { availabilityPath, availabilityTables, type AvailabilityReport } from '@/lib/availability/report';
import { availabilityText, availabilityDisclaimer } from '@/lib/availability/copy';
import { useLocale } from '@/components/i18n/LocaleProvider';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';

export default function AvailabilityReportView({ report }: { report: AvailabilityReport }) {
  const router = useRouter();
  const {locale}=useLocale();
  const t=(text:string)=>availabilityText(text,locale);
  const [query,setQuery] = useState(''), [status,setStatus] = useState('Disponible');
  const [delivery,setDelivery] = useState(''), [notice,setNotice] = useState('');
  const path = availabilityPath(report.projectSlug);
  const deliveries = [...new Set(report.units.map(u=>u.customColumns?.['Plazo de entrega']).filter(Boolean))] as string[];
  const units = useMemo(()=>report.units.filter(u=>(!status || u.status===status) && (!delivery || u.customColumns?.['Plazo de entrega']===delivery) &&
    (!query.trim() || [u.unit,u.type,u.tower,...Object.values(u.customColumns || {})].join(' ').toLowerCase().includes(query.toLowerCase().trim()))),[report.units,query,status,delivery]);
  const tables = availabilityTables(report,units);
  const params = new URLSearchParams({status,q:query,delivery,lang:locale});
  const pdfPath = `${path}/pdf?${params}`;
  async function copy() {
    const url=new URL(path,window.location.origin); if(locale!=='es') url.pathname=`/${locale}${path}`;
    try { await navigator.clipboard.writeText(url.href); setNotice(t('Enlace copiado.')); }
    catch { setNotice(`${t('Copia este enlace:')} ${url.href}`); }
  }
  return <main className="mx-auto max-w-6xl px-4 py-8 text-slate-900 sm:px-8 sm:py-12">
    <header className="border-b border-slate-300 pb-6">
      <div className="mb-2 flex items-center justify-between"><p className="text-sm text-slate-600">Osvaldo Bello</p><PublicLanguageSwitcher/></div>
      <h1 className="text-3xl font-semibold tracking-tight">{report.projectName}</h1>
      <p className="mt-2 text-lg">{t('Disponibilidad de unidades')}</p>
      <p className="mt-3 text-sm text-slate-600">{t('Última actualización del inventario:')} {report.updatedAt}</p>
    </header>
    <div className="my-6 flex flex-wrap items-center gap-3">
      <a href={pdfPath} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2"><Download size={16}/>{t('Descargar PDF')}</a>
      <button onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm hover:bg-slate-50"><Copy size={16}/>{t('Copiar enlace')}</button>
      <button onClick={()=>router.refresh()} className="inline-flex min-h-11 items-center gap-2 px-3 text-sm underline underline-offset-4"><RefreshCw size={16}/>{t('Actualizar consulta')}</button>
      <a href="https://osvaldobello.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm underline underline-offset-4">{t('Consultar a un ejecutivo')}<ExternalLink size={14}/></a>
    </div>
    {notice && <p role="status" className="mb-5 break-all text-sm">{notice}</p>}
    <div className="flex flex-wrap items-end gap-4 border-y border-slate-200 py-4">
      <label className="min-w-52 flex-1 text-sm">{t('Buscar unidad')}<div className="relative mt-2"><Search size={16} className="absolute left-3 top-3 text-slate-500"/><input value={query} maxLength={200} onChange={e=>setQuery(e.target.value)} placeholder={t('Unidad, modelo o bloque')} className="h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3"/></div></label>
      <label className="text-sm">{t('Estado')}<select value={status} onChange={e=>setStatus(e.target.value)} className="mt-2 block h-11 rounded-lg border border-slate-300 px-3"><option value="Disponible">{t('Solo disponibles')}</option><option value="">{t('Todos los estados')}</option>{['Separada','Vendida','Bloqueada'].map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label>
      {deliveries.length>0 && <label className="text-sm">{t('Entrega')}<select value={delivery} onChange={e=>setDelivery(e.target.value)} className="mt-2 block h-11 rounded-lg border border-slate-300 px-3"><option value="">{t('Todos los plazos')}</option>{deliveries.sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).map(d=><option key={d} value={d}>{t(d)}</option>)}</select></label>}
    </div>
    <p className="mt-5 text-sm text-slate-600">{units.length} {t('unidades')} · {t('PDF en tamaño carta horizontal. Los filtros también se aplican a la descarga.')}</p>
    {tables.map((table,i)=><section key={`${table.title}-${i}`} className="mt-8">
      <h2 className="mb-4 text-xl font-semibold">{t(table.title)}</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left text-sm tabular-nums"><caption className="sr-only">{report.projectName} · {t(table.title)}</caption><thead className="border-y border-slate-300"><tr>{table.columns.map((c,j)=><th key={`${c}-${j}`} scope="col" className="px-3 py-3 font-semibold">{t(c)}</th>)}</tr></thead><tbody>{table.rows.map((row,r)=><tr key={`${row[0]}-${r}`} className="border-b border-slate-200">{row.map((cell,c)=><td key={c} className={`px-3 py-3 ${c===0?'font-semibold':''}`}>{c===row.length-1?t(cell):cell}</td>)}</tr>)}</tbody></table></div>
    </section>)}
    {!units.length && <p role="status" className="py-12 text-center text-slate-600">{t('No hay unidades que coincidan con estos filtros.')}</p>}
    <footer className="mt-10 border-t border-slate-300 pt-5 text-sm leading-6 text-slate-600"><p>{availabilityDisclaimer(locale)}</p><p className="mt-3 break-all">{t('Disponibilidad en línea:')} <a className="underline underline-offset-4" href={path}>{path}</a></p></footer>
  </main>;
}
