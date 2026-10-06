import type { PortalUnit } from '@/lib/portal-projects';

export function isGarbageUnitCode(value: unknown): boolean {
  if (!value || typeof value !== 'string') return true;
  const s = value.trim();
  if (s.length < 2 || s.length > 30) return true;
  if (/[:;{}]/.test(s)) return true;
  if (/^(top|width|height|left|right|bottom|border|transform|-ms-|-webkit-|margin|padding|background|display|position|font|color|z-index|opacity|cursor|overflow)/i.test(s)) return true;
  if (s.includes('rotate(') || s.includes('translate(') || s.includes('spinner') || s.includes('px') || s.includes('deg')) return true;
  return false;
}

export const UVE_RESIDENCES_CANONICAL_UNITS: PortalUnit[] = [
  // Nivel 1
  { id: 'uve-101', typologyId: 'type-a', unit: 'A 101', tower: 'Torre A', floor: 1, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 154400, currency: 'USD', status: 'Disponible', isPublic: true, notes: 'Patio 35 m²' },
  { id: 'uve-102', typologyId: 'type-a', unit: 'A 102', tower: 'Torre A', floor: 1, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 154400, currency: 'USD', status: 'Disponible', isPublic: true, notes: 'Patio 20 m²' },
  { id: 'uve-103', typologyId: 'type-a', unit: 'A 103', tower: 'Torre A', floor: 1, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 154400, currency: 'USD', status: 'Disponible', isPublic: true, notes: 'Patio 19 m²' },
  { id: 'uve-104', typologyId: 'type-b', unit: 'A 104', tower: 'Torre A', floor: 1, type: 'Apartamento Tipo B', bedrooms: 2, bathrooms: 2, area: 115, price: 181000, currency: 'USD', status: 'Separada', isPublic: true, notes: 'Patio 84 m²' },
  { id: 'uve-105', typologyId: 'type-a', unit: 'A 105', tower: 'Torre A', floor: 1, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 154400, currency: 'USD', status: 'Bloqueada', isPublic: true, notes: 'Patio 45 m²' },
  { id: 'uve-106', typologyId: 'type-a', unit: 'A 106', tower: 'Torre A', floor: 1, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 154400, currency: 'USD', status: 'Disponible', isPublic: true, notes: 'Patio 20 m²' },
  { id: 'uve-107', typologyId: 'type-a', unit: 'A 107', tower: 'Torre A', floor: 1, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 154400, currency: 'USD', status: 'Vendida', isPublic: true, notes: 'Patio 44 m²' },

  // Nivel 2
  { id: 'uve-201', typologyId: 'type-a', unit: 'A 201', tower: 'Torre A', floor: 2, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 144400, currency: 'USD', status: 'Separada', isPublic: true },
  { id: 'uve-202', typologyId: 'type-a', unit: 'A 202', tower: 'Torre A', floor: 2, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 144400, currency: 'USD', status: 'Vendida', isPublic: true },
  { id: 'uve-203', typologyId: 'type-a', unit: 'A 203', tower: 'Torre A', floor: 2, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 144400, currency: 'USD', status: 'Disponible', isPublic: true },
  { id: 'uve-204', typologyId: 'type-b', unit: 'A 204', tower: 'Torre A', floor: 2, type: 'Apartamento Tipo B', bedrooms: 2, bathrooms: 2, area: 115, price: 181000, currency: 'USD', status: 'Disponible', isPublic: true },
  { id: 'uve-205', typologyId: 'type-a', unit: 'A 205', tower: 'Torre A', floor: 2, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 144400, currency: 'USD', status: 'Separada', isPublic: true },
  { id: 'uve-206', typologyId: 'type-a', unit: 'A 206', tower: 'Torre A', floor: 2, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 144400, currency: 'USD', status: 'Disponible', isPublic: true },
  { id: 'uve-207', typologyId: 'type-a', unit: 'A 207', tower: 'Torre A', floor: 2, type: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, area: 96, price: 144400, currency: 'USD', status: 'Disponible', isPublic: true },

  // Nivel 3
  { id: 'uve-301', typologyId: 'type-ph', unit: 'A 301', tower: 'Torre A', floor: 3, type: 'Penthouse Tipo A', bedrooms: 2, bathrooms: 3, area: 96, price: 175000, currency: 'USD', status: 'Vendida', isPublic: true, notes: 'Terraza Privada 96 m²' },
  { id: 'uve-302', typologyId: 'type-ph', unit: 'A 302', tower: 'Torre A', floor: 3, type: 'Penthouse Tipo A', bedrooms: 2, bathrooms: 3, area: 96, price: 175000, currency: 'USD', status: 'Separada', isPublic: true, notes: 'Terraza Privada 96 m²' },
  { id: 'uve-303', typologyId: 'type-ph', unit: 'A 303', tower: 'Torre A', floor: 3, type: 'Penthouse Tipo A', bedrooms: 2, bathrooms: 3, area: 96, price: 175000, currency: 'USD', status: 'Vendida', isPublic: true, notes: 'Terraza Privada 96 m²' },
  { id: 'uve-304', typologyId: 'type-ph-b', unit: 'A 304', tower: 'Torre A', floor: 3, type: 'Penthouse Tipo B', bedrooms: 2, bathrooms: 3, area: 115, price: 194000, currency: 'USD', status: 'Disponible', isPublic: true, notes: 'Terraza Privada 115 m²' },
  { id: 'uve-305', typologyId: 'type-ph', unit: 'A 305', tower: 'Torre A', floor: 3, type: 'Penthouse Tipo A', bedrooms: 2, bathrooms: 3, area: 96, price: 175000, currency: 'USD', status: 'Vendida', isPublic: true, notes: 'Terraza Privada 96 m²' },
  { id: 'uve-306', typologyId: 'type-ph', unit: 'A 306', tower: 'Torre A', floor: 3, type: 'Penthouse Tipo A', bedrooms: 2, bathrooms: 3, area: 96, price: 175000, currency: 'USD', status: 'Vendida', isPublic: true, notes: 'Terraza Privada 96 m²' },
  { id: 'uve-307', typologyId: 'type-ph', unit: 'A 307', tower: 'Torre A', floor: 3, type: 'Penthouse Tipo A', bedrooms: 2, bathrooms: 3, area: 96, price: 175000, currency: 'USD', status: 'Vendida', isPublic: true, notes: 'Terraza Privada 96 m²' },
];
