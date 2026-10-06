'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PARIDERA_INVENTORY_DATE,
  PARIDERA_PHASES,
  PARIDERA_UNITS,
  type ParideraPhaseKey,
  type ParideraUnit,
} from '@/lib/data/paridera-portfolio';
import { Eyebrow, RollButton, usd } from '@/components/paridera/ParideraKit';

type SortKey = 'price-asc' | 'price-desc' | 'size-desc' | 'level-asc';

const PAGE = 12;
const PHASE_NAME = Object.fromEntries(PARIDERA_PHASES.map((p) => [p.key, p.name])) as Record<ParideraPhaseKey, string>;

const fmtM2 = (v: number | null) => (v ? `${v.toLocaleString('en-US', { maximumFractionDigits: 1 })} m²` : '—');

function uniq(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

function sortUnits(units: ParideraUnit[], key: SortKey) {
  const byPrice = (u: ParideraUnit) => u.price ?? Number.MAX_SAFE_INTEGER;
  return [...units].sort((a, b) => {
    if (key === 'price-asc') return byPrice(a) - byPrice(b);
    if (key === 'price-desc') return byPrice(b) - byPrice(a);
    if (key === 'size-desc') return (b.totalM2 ?? 0) - (a.totalM2 ?? 0);
    return Number(a.level) - Number(b.level) || a.code.localeCompare(b.code);
  });
}

export default function ParideraAvailability({
  phase,
  id = 'disponibilidad',
  ctaHref = '/solicitar-acceso',
  ctaLabel = 'Solicitar acceso para cotizar',
}: {
  /** Restrict the list to one development (project landing). */
  phase?: ParideraPhaseKey;
  id?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const [activePhase, setActivePhase] = useState<ParideraPhaseKey | 'all'>(phase ?? 'all');
  const [bedrooms, setBedrooms] = useState('');
  const [view, setView] = useState('');
  const [status, setStatus] = useState<'Disponible' | 'all'>('Disponible');
  const [sort, setSort] = useState<SortKey>('price-asc');
  const [visible, setVisible] = useState(PAGE);

  const scoped = useMemo(
    () => PARIDERA_UNITS.filter((u) => activePhase === 'all' || u.phase === activePhase),
    [activePhase],
  );
  const bedroomOptions = useMemo(() => uniq(scoped.map((u) => u.bedrooms)), [scoped]);
  const viewOptions = useMemo(() => uniq(scoped.map((u) => u.view)), [scoped]);

  const results = useMemo(() => {
    const filtered = scoped.filter(
      (u) =>
        (status === 'all' || u.status === status) &&
        (!bedrooms || u.bedrooms === bedrooms) &&
        (!view || u.view === view),
    );
    return sortUnits(filtered, sort);
  }, [scoped, status, bedrooms, view, sort]);

  const availableCount = scoped.filter((u) => u.status === 'Disponible').length;
  const fromPrice = Math.min(...scoped.filter((u) => u.status === 'Disponible' && u.price).map((u) => u.price as number));
  const singlePhase = !!phase;

  const resetFilters = (next: ParideraPhaseKey | 'all') => {
    setActivePhase(next);
    setBedrooms('');
    setView('');
    setVisible(PAGE);
  };

  return (
    <section id={id} className="pb-section pb-avail">
      <style>{AVAILABILITY_STYLES}</style>
      <div className="pb-container">
        <div className="pb-head">
          <div>
            <Eyebrow>Disponibilidad</Eyebrow>
            <h2 className="pb-h2">
              {singlePhase ? 'Residencias' : 'Elige tu'}
              <br />
              <em>{singlePhase ? 'disponibles hoy' : 'residencia'}</em>
            </h2>
          </div>
          <div className="pb-avail__summary">
            <div>
              <strong>{availableCount}</strong>
              <span>{availableCount === 1 ? 'residencia disponible' : 'residencias disponibles'}</span>
            </div>
            {Number.isFinite(fromPrice) && (
              <div>
                <strong>{usd(fromPrice)}</strong>
                <span>precio desde</span>
              </div>
            )}
          </div>
        </div>

        {!singlePhase && (
          <div className="pb-avail__tabs" role="tablist" aria-label="Desarrollo">
            {(['all', ...PARIDERA_PHASES.map((p) => p.key)] as const).map((key) => {
              const count = PARIDERA_UNITS.filter((u) => u.status === 'Disponible' && (key === 'all' || u.phase === key)).length;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activePhase === key}
                  className={activePhase === key ? 'is-active' : ''}
                  onClick={() => resetFilters(key)}
                >
                  {key === 'all' ? 'Todos' : PHASE_NAME[key]}
                  <sup>{count}</sup>
                </button>
              );
            })}
          </div>
        )}

        <div className="pb-avail__filters">
          <label>
            <span>Tipología</span>
            <select value={bedrooms} onChange={(e) => { setBedrooms(e.target.value); setVisible(PAGE); }}>
              <option value="">Todas</option>
              {bedroomOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label>
            <span>Vista</span>
            <select value={view} onChange={(e) => { setView(e.target.value); setVisible(PAGE); }} disabled={!viewOptions.length}>
              <option value="">Todas</option>
              {viewOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label>
            <span>Estado</span>
            <select value={status} onChange={(e) => { setStatus(e.target.value as 'Disponible' | 'all'); setVisible(PAGE); }}>
              <option value="Disponible">Disponibles</option>
              <option value="all">Disponibles y reservadas</option>
            </select>
          </label>
          <label>
            <span>Ordenar</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="size-desc">Metraje: mayor a menor</option>
              <option value="level-asc">Nivel</option>
            </select>
          </label>
        </div>

        <div className="pb-avail__table" role="table" aria-label="Unidades disponibles">
          <div className={`pb-avail__row pb-avail__row--head${singlePhase ? ' is-single' : ''}`} role="row">
            <span role="columnheader">Unidad</span>
            {!singlePhase && <span role="columnheader">Desarrollo</span>}
            <span role="columnheader">Nivel</span>
            <span role="columnheader">Tipología</span>
            <span role="columnheader">Vista</span>
            <span role="columnheader">Interior</span>
            <span role="columnheader">Total</span>
            <span role="columnheader" className="pb-avail__price">Precio</span>
          </div>
          <AnimatePresence initial={false}>
            {results.slice(0, visible).map((u) => (
              <motion.div
                key={`${u.phase}-${u.code}`}
                layout="position"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className={`pb-avail__row${u.status === 'Reservado' ? ' is-reserved' : ''}${singlePhase ? ' is-single' : ''}`}
                role="row"
              >
                <span role="cell" className="pb-avail__code">{u.code}</span>
                {!singlePhase && <span role="cell" data-label="Desarrollo">{PHASE_NAME[u.phase]}</span>}
                <span role="cell" data-label="Nivel">{u.level}</span>
                <span role="cell" data-label="Tipología" className="pb-avail__typ" title={u.typology}>{u.typology}</span>
                <span role="cell" data-label="Vista">{u.view || '—'}</span>
                <span role="cell" data-label="Interior">{fmtM2(u.interiorM2)}</span>
                <span role="cell" data-label="Total">{fmtM2(u.totalM2)}</span>
                <span role="cell" className="pb-avail__price">
                  {u.status === 'Reservado' ? 'Reservada' : u.price ? usd(u.price) : 'Consultar'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {results.length === 0 && <p className="pb-avail__empty">No hay unidades con esos filtros.</p>}
        </div>

        <div className="pb-avail__foot">
          <span>
            Mostrando {Math.min(visible, results.length)} de {results.length} · Inventario oficial al {PARIDERA_INVENTORY_DATE}. Precios en dólares, sujetos a cambio sin previo aviso.
          </span>
          <div className="pb-avail__foot-actions">
            {visible < results.length && (
              <button type="button" className="pb-avail__more" onClick={() => setVisible((v) => v + PAGE)}>
                Ver más unidades
              </button>
            )}
            <RollButton href={ctaHref} variant="ink">{ctaLabel}</RollButton>
          </div>
        </div>
      </div>
    </section>
  );
}

const AVAILABILITY_STYLES = `
.pb-avail__summary{display:flex;gap:40px}
.pb-avail__summary div{display:flex;flex-direction:column}
.pb-avail__summary strong{font-size:clamp(1.6rem,2.4vw,2.4rem);font-weight:500;letter-spacing:-0.04em;line-height:1}
.pb-avail__summary span{font-size:13px;color:var(--text);margin-top:6px}
.pb-avail__tabs{display:flex;gap:6px 32px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-bottom:28px}
.pb-avail__tabs button{position:relative;background:none;border:0;padding:0 0 16px;font:inherit;font-size:clamp(1.1rem,1.6vw,1.5rem);font-weight:500;letter-spacing:-0.02em;color:var(--muted);cursor:pointer;transition:color .3s}
.pb-avail__tabs button sup{font-size:.55em;margin-left:4px;color:var(--brand);font-weight:600}
.pb-avail__tabs button::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--ink);transform:scaleX(0);transform-origin:left;transition:transform .5s cubic-bezier(.22,1,.36,1)}
.pb-avail__tabs button:hover{color:var(--ink)}
.pb-avail__tabs button.is-active{color:var(--ink)}
.pb-avail__tabs button.is-active::after{transform:scaleX(1)}
.pb-avail__filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:24px}
.pb-avail__filters label{display:flex;flex-direction:column;gap:6px}
.pb-avail__filters label span{font-size:12.5px;font-weight:600;color:var(--muted);letter-spacing:.03em}
.pb-avail__filters select{appearance:none;width:100%;height:48px;padding:0 40px 0 16px;border-radius:12px;border:1px solid var(--line);background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' stroke='%230A2A3B' stroke-width='1.5'%3E%3Cpath d='m1 1.5 5 5 5-5'/%3E%3C/svg%3E") no-repeat right 16px center;font:inherit;font-size:14.5px;color:var(--ink);cursor:pointer;transition:border-color .3s}
.pb-avail__filters select:hover,.pb-avail__filters select:focus{border-color:var(--ink);outline:none}
.pb-avail__filters select:disabled{opacity:.5;cursor:default}
.pb-avail__table{border-top:1px solid var(--line)}
.pb-avail__row{display:grid;grid-template-columns:90px 110px 60px minmax(0,2.2fr) minmax(0,1.3fr) 90px 90px 130px;gap:16px;align-items:center;padding:18px 12px;border-bottom:1px solid var(--line);font-size:14.5px;transition:background .3s}
.pb-avail__row.is-single{grid-template-columns:90px 60px minmax(0,2.4fr) minmax(0,1.3fr) 100px 100px 140px}
.pb-avail__row--head{font-size:12.5px;font-weight:600;color:var(--muted);letter-spacing:.03em;padding-top:14px;padding-bottom:14px}
.pb-avail__row:not(.pb-avail__row--head):hover{background:var(--sand)}
.pb-avail__code{font-weight:600;font-variant-numeric:tabular-nums}
.pb-avail__typ{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pb-avail__price{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
.pb-avail__row.is-reserved{color:var(--muted)}
.pb-avail__row.is-reserved .pb-avail__price{font-weight:500}
.pb-avail__empty{padding:40px 12px;color:var(--text);margin:0}
.pb-avail__foot{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;margin-top:28px;font-size:13px;color:var(--muted)}
.pb-avail__foot>span{max-width:520px}
.pb-avail__foot-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.pb-avail__more{height:48px;padding:0 22px;border-radius:999px;border:1px solid var(--ink);background:none;font:inherit;font-size:14px;font-weight:600;color:var(--ink);cursor:pointer;transition:background .3s,color .3s}
.pb-avail__more:hover{background:var(--ink);color:#fff}
@media (max-width:1024px){
  .pb-avail__filters{grid-template-columns:1fr 1fr}
  .pb-avail__row--head{display:none}
  .pb-avail__row,.pb-avail__row.is-single{grid-template-columns:1fr auto;gap:4px 16px;padding:18px 4px}
  .pb-avail__row [data-label]{display:none}
  .pb-avail__row .pb-avail__typ{display:block;grid-column:1/-1;order:3;color:var(--text);font-size:13.5px;white-space:normal}
  .pb-avail__code{font-size:16px}
}
@media (max-width:640px){
  .pb-avail__summary{gap:24px}
  .pb-avail__filters{grid-template-columns:1fr}
}
`;
