import React from 'react';
import { Activity, Anchor, Armchair, ArrowUpDown, Baby, Bath, BedDouble, BriefcaseBusiness, Building2, CircleParking, CheckCircle2, ConciergeBell, DoorOpen, Dumbbell, Flag, Flame, Footprints, HeartPulse, Home, Hotel, Store, Trees, Umbrella, UtensilsCrossed, Waves, type LucideIcon } from 'lucide-react';

export const CORAL_GOLF_RESORT_AMENITIES = [
  'Acceso zona Comercial',
  'Hotel',
  'Campo de Golf',
  'Casa club',
  'Parque',
  'Muelle',
  'Club Raqueta',
  'Deporte AR',
  'Coral Beach',
  'Oficinas',
  'Camino Ecológico',
  'Parque de Ejercicio senior',
] as const;

export const PALM_VIEW_EXCLUSIVE_AMENITIES = [
  'Espacios Amueblados',
  'Piscinas para adultos y niños',
  'Parque infantil',
  'Servicio de housekeeping',
  'Servicios de conserjería',
  'Restaurante bar',
  'Sala de juntas',
  '2 Lobbies de acceso',
  'Turco',
  'Parqueaderos',
  'Gimnasio',
  'Sauna',
  'Ascensores',
  'Jacuzzi',
  'Sendero Peatonal',
] as const;

function resolvePalmViewIcon(name: string): LucideIcon {
  const norm = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // 1. Coral Golf Resort specific
  if (norm.includes('comercial') || norm.includes('tienda') || norm.includes('shopping')) return Store;
  if (norm.includes('hotel') || norm.includes('hospedaje')) return Hotel;
  if (norm.includes('golf') || norm.includes('campo')) return Flag;
  if (norm.includes('casa club') || norm.includes('club house')) return Home;
  if (norm.includes('muelle') || norm.includes('marina') || norm.includes('lago') || norm.includes('bote')) return Anchor;
  if (norm.includes('raqueta') || norm.includes('padel') || norm.includes('tennis') || norm.includes('tenis')) return Activity;
  if (norm.includes('deporte ar') || norm.includes('deporte') || norm.includes('ar')) return Activity;
  if (norm.includes('coral beach') || norm.includes('beach') || norm.includes('playa')) return Umbrella;
  if (norm.includes('oficina') || norm.includes('cowork') || norm.includes('corporativo')) return BriefcaseBusiness;
  if (norm.includes('camino ecologico') || norm.includes('ecologico') || norm.includes('sendero')) return Footprints;
  if (norm.includes('senior') || norm.includes('tercera edad')) return HeartPulse;
  if (norm.includes('parque de ejercicio') || norm.includes('calistenia')) return HeartPulse;
  if (norm.includes('parque')) return Trees;

  // 2. Palm View specific
  if (norm.includes('amueblado') || norm.includes('mueble') || norm.includes('espacios amueblados')) return Armchair;
  if (norm.includes('piscina') || norm.includes('pool') || norm.includes('alberca')) return Waves;
  if (norm.includes('infantil') || norm.includes('nino') || norm.includes('kids') || norm.includes('juegos')) return Baby;
  if (norm.includes('housekeeping') || norm.includes('limpieza') || norm.includes('mantenimiento')) return ConciergeBell;
  if (norm.includes('conserjeria') || norm.includes('conserje') || norm.includes('concierge')) return ConciergeBell;
  if (norm.includes('restaurante') || norm.includes('bar') || norm.includes('gastronom')) return UtensilsCrossed;
  if (norm.includes('junta') || norm.includes('reuniones') || norm.includes('business')) return BriefcaseBusiness;
  if (norm.includes('lobby') || norm.includes('lobbies') || norm.includes('recepcion') || norm.includes('acceso')) return DoorOpen;
  if (norm.includes('turco') || norm.includes('vapor')) return Flame;
  if (norm.includes('parqueo') || norm.includes('estacionamiento') || norm.includes('parqueaderos') || norm.includes('parking')) return CircleParking;
  if (norm.includes('gimnasio') || norm.includes('gym') || norm.includes('fitness')) return Dumbbell;
  if (norm.includes('sauna')) return Flame;
  if (norm.includes('ascensor') || norm.includes('elevador')) return ArrowUpDown;
  if (norm.includes('jacuzzi') || norm.includes('hidromasaje')) return Waves;
  if (norm.includes('peatonal') || norm.includes('caminar')) return Footprints;

  // General fallbacks
  if (norm.includes('verde') || norm.includes('jardin') || norm.includes('arbol')) return Trees;
  if (norm.includes('seguridad') || norm.includes('vigilancia')) return Building2;
  if (norm.includes('cama') || norm.includes('habitacion')) return BedDouble;
  if (norm.includes('bano')) return Bath;

  return CheckCircle2;
}

export function PalmViewAmenityIcon({
  name,
  className = 'h-5 w-5',
  strokeWidth = 1.75,
  style,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  const IconComponent = resolvePalmViewIcon(name);
  return React.createElement(IconComponent, { 'aria-hidden': true, className, strokeWidth, style });
}
