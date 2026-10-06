import type { PortalProject, PortalUnit } from '@/lib/portal-projects';
import { compareUnitCodes } from '@/lib/unit-code';
import { formatCurrencyExplicit } from '@/lib/utils';

export type AvailabilityReport = { projectName: string; projectSlug: string; updatedAt: string; units: PortalUnit[]; customColumns: string[] };
export type AvailabilityTable = { title: string; columns: string[]; rows: string[][] };

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const hidden = /^(hoja de origen|source|internal|notes|notas|cliente|client|contact|broker|owner|telefono|email|correo|.*_id$)/i;
const deliveryKey = (key: string) => normalize(key) === 'plazo de entrega';
const parkingKey = (key: string) => /^(parking|parkings|parqueos?|estac\.?)$/.test(normalize(key));
const standardColumn = (key: string) => parkingKey(key) || /^(bedrooms|bathrooms|construction_sqm|total_sqm|typology|habitaciones|banos|ban\.?|1\/2 ban\.?|hab\.?|nivel|piso|floor|torre|bloque|tower|tipo|precio|price|m2|area \(m[²2]\))$/.test(normalize(key));
function customValue(unit: PortalUnit, column: string) {
  const value = unit.customColumns?.[column]?.trim() || '—';
  return /price|precio/i.test(column) && /^\d+(\.\d+)?$/.test(value)
    ? formatCurrencyExplicit(Number(value),unit.currency || 'USD') : value;
}

/** Only public inventory and its display columns cross the public boundary. */
export function availabilityReport(project: PortalProject): AvailabilityReport {
  const units: PortalUnit[] = (project.projectType === 'land_subdivision' && project.lots.length ? project.lots.map(lot => ({
    id: lot.id, unit: lot.code, tower: lot.block, floor: 0, type: 'Solar', bedrooms: 0, bathrooms: 0,
    area: lot.areaSqm, price: lot.price, currency: lot.currency, status: lot.status, isPublic: lot.isPublic,
  })) : project.units).filter(unit => unit.isPublic !== false);
  const customColumns = (project.customColumnsList || []).filter(key => !hidden.test(normalize(key)) && !deliveryKey(key));
  return { projectName: project.name, projectSlug: project.slug, updatedAt: project.updatedAt,
    customColumns, units: units.map(unit => ({
      id: unit.id, unit: unit.unit, tower: unit.tower, floor: unit.floor, type: unit.type,
      bedrooms: unit.bedrooms, bathrooms: unit.bathrooms, area: unit.area, price: unit.price,
      currency: unit.currency, status: unit.status,
      customColumns: Object.fromEntries(Object.entries(unit.customColumns || {}).filter(([key]) => customColumns.includes(key) || deliveryKey(key))),
    })).sort((a,b) => compareUnitCodes(a.unit,b.unit)) };
}

export function availabilityTables(report: AvailabilityReport, units = report.units): AvailabilityTable[] {
  const groups = new Map<string, PortalUnit[]>();
  for (const unit of units) {
    const delivery = Object.entries(unit.customColumns || {}).find(([key]) => deliveryKey(key))?.[1];
    const title = delivery ? `Entrega: ${delivery}` : 'Inventario';
    groups.set(title, [...(groups.get(title) || []), unit]);
  }
  const tables: AvailabilityTable[] = [];
  for (const [title, group] of [...groups].sort(([a],[b]) => a.localeCompare(b,'es',{numeric:true}))) {
    if (report.projectSlug === 'cipres-residences' && report.customColumns.length) {
      const preferred = ['metros cuadrados', 'esmeralda', 'perla', 'ambar'];
      const columns = [...report.customColumns].sort((a,b) => {
        const rank = (key: string) => { const i = preferred.indexOf(normalize(key)); return i < 0 ? preferred.length : i; };
        return rank(a) - rank(b) || a.localeCompare(b,'es');
      });
      // Wide source sheets are split into readable column panels; never shrink data to illegibility.
      for (let start = 0; start < columns.length; start += 5) {
        const cols = columns.slice(start,start+5);
        tables.push({ title: columns.length > 5 ? `${title} · Datos ${Math.floor(start/5)+1}` : title,
          columns: ['Unidad', ...cols, 'Estado'], rows: group.map(u => [u.unit, ...cols.map(c => customValue(u,c)), u.status]) });
      }
    } else {
      // A supplementary field must never replace the inventory's core fields.
      tables.push({ title, columns: ['Unidad', 'Torre / bloque', 'Piso', 'Tipología', 'Hab. / Baños / Parq.', 'Área m²', 'Precio', 'Estado'],
        rows: group.map(u => {
          const parking = Object.entries(u.customColumns || {}).find(([key]) => parkingKey(key))?.[1] || '—';
          return [u.unit, u.tower === 'Sin torre' ? '—' : u.tower || '—', u.floor > 0 ? String(u.floor) : '—', u.type || '—',
            `${u.bedrooms || '—'} / ${u.bathrooms || '—'} / ${parking}`, u.area ? String(u.area) : '—',
            u.price > 0 ? formatCurrencyExplicit(u.price,u.currency || 'USD') : 'Consultar',u.status];
        }) });
      const extraColumns = report.customColumns.filter(key => !standardColumn(key));
      for (let start = 0; start < extraColumns.length; start += 5) {
        const cols = extraColumns.slice(start,start+5);
        tables.push({title:`${title} · Datos ${Math.floor(start/5)+1}`, columns:['Unidad',...cols,'Estado'],
          rows:group.map(u => [u.unit,...cols.map(c => customValue(u,c)),u.status])});
      }
    }
  }
  return tables;
}

export function availabilityPath(slug: string) { return `/disponibilidad/${encodeURIComponent(slug)}`; }
