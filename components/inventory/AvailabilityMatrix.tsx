'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useState, useMemo } from 'react';
import { Search, Eye, EyeOff, Type, RotateCcw, X } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import type { ProjectUnit, UnitStatus } from '../../types/inventory';

interface AvailabilityMatrixProps {
  units: ProjectUnit[];
  projectName: string;
  onUpdateStatus?: (unitId: string, newStatus: UnitStatus) => void;
}

const STATUS_CONFIG: Record<UnitStatus, { label: string; bg: string; text: string; border: string }> = {
  available: { label: 'Disponible', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  reserved:  { label: 'Reservado',  bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  sold:      { label: 'Vendido',    bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30' },
  blocked:   { label: 'Bloqueado',  bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/30' },
};

const DEFAULT_COLUMNS = [
  { key: 'unit_number', label: 'Unidad' },
  { key: 'level', label: 'Nivel / Torre' },
  { key: 'typology', label: 'Tipología' },
  { key: 'sqm', label: 'Metraje' },
  { key: 'price', label: 'Precio Lista' },
  { key: 'status', label: 'Estado' },
  { key: 'notes', label: 'Notas / Rooftop' },
];

export default function AvailabilityMatrix({
  units,
  projectName,
  onUpdateStatus
}: AvailabilityMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typologyFilter, setTypologyFilter] = useState<string>('all');
  
  // Column customization state
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMNS.map(c => c.key));
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [showConfigModal, setShowConfigModal] = useState(false);

  const typologies = useMemo(() => {
    return Array.from(new Set(units.map(u => u.typology)));
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchSearch = u.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.typology.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.building_or_tower && u.building_or_tower.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchTypology = typologyFilter === 'all' || u.typology === typologyFilter;

      return matchSearch && matchStatus && matchTypology;
    });
  }, [units, searchTerm, statusFilter, typologyFilter]);

  // Metrics
  const total = units.length;
  const available = units.filter(u => u.status === 'available').length;
  const reserved = units.filter(u => u.status === 'reserved').length;
  const sold = units.filter(u => u.status === 'sold').length;

  const visibleColumns = columnOrder.filter(k => !hiddenColumns.includes(k));

  const renderHeaderCell = (colKey: string) => {
    const colDef = DEFAULT_COLUMNS.find(c => c.key === colKey);
    const title = customLabels[colKey] || colDef?.label || colKey;
    return (
      <th key={colKey} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/60">
        {title}
      </th>
    );
  };

  const renderDataCell = (unit: ProjectUnit, colKey: string) => {
    const cfg = STATUS_CONFIG[unit.status] || STATUS_CONFIG.available;

    switch (colKey) {
      case 'unit_number':
        return <td key={colKey} className="px-6 py-4 font-black text-white text-sm">{unit.unit_number}</td>;
      case 'level':
        return <td key={colKey} className="px-6 py-4 text-white/70"><LocalizedText text={"Nivel "} />{unit.floor_level} {unit.building_or_tower ? `• ${unit.building_or_tower}` : ''}</td>;
      case 'typology':
        return <td key={colKey} className="px-6 py-4">{unit.typology} ({unit.bedrooms}<LocalizedText text={"H / "} />{unit.bathrooms}<LocalizedText text={"B)"} /></td>;
      case 'sqm':
        return <td key={colKey} className="px-6 py-4 font-bold">{unit.total_sqm}<LocalizedText text={" m²"} /></td>;
      case 'price':
        return <td key={colKey} className="px-6 py-4 font-black text-brand-secondary text-sm">{formatCurrency(unit.price, unit.currency)}</td>;
      case 'status':
        return (
          <td key={colKey} className="px-6 py-4">
            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", cfg.bg, cfg.text, cfg.border)}>
              {cfg.label}
            </span>
          </td>
        );
      case 'notes':
        return <td key={colKey} className="px-6 py-4 text-white/50 text-xs">{unit.notes || '—'}</td>;
      default:
        return <td key={colKey} className="px-6 py-4 text-white/50">—</td>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50"><LocalizedText text={"Total Unidades"} /></p>
          <p className="text-2xl font-black text-white mt-1">{total}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400"><LocalizedText text={"Disponibles"} /></p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{available}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400"><LocalizedText text={"En Reserva"} /></p>
          <p className="text-2xl font-black text-amber-400 mt-1">{reserved}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400"><LocalizedText text={"Vendidas"} /></p>
          <p className="text-2xl font-black text-red-400 mt-1">{sold}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <UITranslationBoundary attributes={["placeholder"]}><input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por unidad, nivel o tipología..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-brand-secondary"
          /></UITranslationBoundary>
        </div>

        {/* Filters and Custom Columns Button */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none"
          >
            <option value="all" className="bg-slate-900"><LocalizedText text={"Todos los Estados"} /></option>
            <option value="available" className="bg-slate-900"><LocalizedText text={"Disponibles"} /></option>
            <option value="reserved" className="bg-slate-900"><LocalizedText text={"Reservadas"} /></option>
            <option value="sold" className="bg-slate-900"><LocalizedText text={"Vendidas"} /></option>
          </select>

          {typologies.length > 0 && (
            <select
              value={typologyFilter}
              onChange={e => setTypologyFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none"
            >
              <option value="all" className="bg-slate-900"><LocalizedText text={"Todas las Tipologías"} /></option>
              {typologies.map(t => (
                <option key={t} value={t} className="bg-slate-900">{t}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
          >
            <Type className="w-3.5 h-3.5 text-brand-secondary" /><LocalizedText text={"Personalizar Columnas"} /></button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {visibleColumns.map(k => renderHeaderCell(k))}
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-white/60"><LocalizedText text={"Acción"} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white font-medium">
              {filteredUnits.map(unit => (
                <tr key={unit.id} className="hover:bg-white/5 transition-colors">
                  {visibleColumns.map(k => renderDataCell(unit, k))}
                  <td className="px-6 py-4 text-right">
                    {unit.status === 'available' ? (
                      <button
                        onClick={() => onUpdateStatus?.(unit.id, 'reserved')}
                        className="px-3 py-1.5 rounded-lg bg-brand-secondary/20 hover:bg-brand-secondary text-brand-secondary hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                      ><LocalizedText text={"Reservar"} /></button>
                    ) : unit.status === 'reserved' ? (
                      <button
                        onClick={() => onUpdateStatus?.(unit.id, 'available')}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-[10px] font-bold transition-all"
                      ><LocalizedText text={"Liberar"} /></button>
                    ) : (
                      <span className="text-[10px] text-white/40 font-bold">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Personalizar Columnas */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-xl border border-white/10 space-y-6 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white"><LocalizedText text={"Personalizar Columnas de Inventario"} /></h3>
                <p className="text-xs text-white/50 mt-0.5"><LocalizedText text={"Renombra títulos (ej. Notas a Rooftop), oculta o reordena."} /></p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {columnOrder.map((key, idx) => {
                const def = DEFAULT_COLUMNS.find(c => c.key === key);
                if (!def) return null;
                const isHidden = hiddenColumns.includes(key);
                const currentLabel = customLabels[key] !== undefined ? customLabels[key] : def.label;

                return (
                  <div key={key} className={cn("p-3 rounded-2xl border flex items-center justify-between gap-3", isHidden ? "bg-white/5 border-white/5 opacity-50" : "bg-white/5 border-white/10")}>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={currentLabel}
                        onChange={(e) => setCustomLabels(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:border-brand-secondary outline-none"
                      />
                      {customLabels[key] && customLabels[key] !== def.label && (
                        <UITranslationBoundary attributes={["title"]}><button
                          onClick={() => setCustomLabels(prev => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                          })}
                          className="p-1 text-white/40 hover:text-brand-secondary"
                          title="Restablecer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button></UITranslationBoundary>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (isHidden) {
                            setHiddenColumns(hiddenColumns.filter(c => c !== key));
                          } else {
                            setHiddenColumns([...hiddenColumns, key]);
                          }
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
                      >
                        {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-brand-secondary" />}
                      </button>
                      <button
                        disabled={idx === 0}
                        onClick={() => {
                          const next = [...columnOrder];
                          const temp = next[idx - 1];
                          next[idx - 1] = next[idx];
                          next[idx] = temp;
                          setColumnOrder(next);
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        disabled={idx === columnOrder.length - 1}
                        onClick={() => {
                          const next = [...columnOrder];
                          const temp = next[idx + 1];
                          next[idx + 1] = next[idx];
                          next[idx] = temp;
                          setColumnOrder(next);
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2.5 rounded-2xl bg-brand-secondary hover:bg-brand-secondary/90 text-white text-xs font-black uppercase tracking-wider"
              ><LocalizedText text={"Aplicar Configuración"} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
