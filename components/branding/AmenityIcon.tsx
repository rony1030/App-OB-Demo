import React from 'react';
import { Waves, Dumbbell, DoorOpen, BriefcaseBusiness, Baby, ShieldCheck, BusFront, PawPrint, Trees, Users, Umbrella, Building2, Wine, Sparkles, Wifi, Tv, Flame, ArrowUpDown, Binoculars, CircleParking, ConciergeBell, Goal, Martini, PersonStanding, UtensilsCrossed, Activity, Anchor, Armchair, Footprints, HeartPulse, Hotel, Store, type LucideIcon } from 'lucide-react';

interface AmenityIconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function AmenityIcon({ name, className = 'h-4 w-4', strokeWidth = 1.5, style }: AmenityIconProps) {
  const normalized = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let IconComponent: LucideIcon = Building2;

  if (
    normalized.includes('piscina') ||
    normalized.includes('pool') ||
    normalized.includes('alberca') ||
    normalized.includes('jacuzzi') ||
    normalized.includes('swim')
  ) {
    IconComponent = Waves;
  } else if (
    normalized.includes('gimnasio') ||
    normalized.includes('gym') ||
    normalized.includes('fitness') ||
    normalized.includes('pesas') ||
    normalized.includes('crossfit')
  ) {
    IconComponent = Dumbbell;
  } else if (
    normalized.includes('comercial') ||
    normalized.includes('tienda') ||
    normalized.includes('shopping')
  ) {
    IconComponent = Store;
  } else if (
    normalized.includes('hotel') ||
    normalized.includes('hospedaje')
  ) {
    IconComponent = Hotel;
  } else if (
    normalized.includes('muelle') ||
    normalized.includes('marina') ||
    normalized.includes('embarcadero')
  ) {
    IconComponent = Anchor;
  } else if (
    normalized.includes('raqueta') ||
    normalized.includes('padel') ||
    normalized.includes('tennis') ||
    normalized.includes('deporte')
  ) {
    IconComponent = Activity;
  } else if (
    normalized.includes('amueblado') ||
    normalized.includes('mueble')
  ) {
    IconComponent = Armchair;
  } else if (
    normalized.includes('senior') ||
    normalized.includes('tercera edad')
  ) {
    IconComponent = HeartPulse;
  } else if (
    normalized.includes('turco') ||
    normalized.includes('vapor')
  ) {
    IconComponent = Flame;
  } else if (
    normalized.includes('sendero') ||
    normalized.includes('peatonal') ||
    normalized.includes('caminar')
  ) {
    IconComponent = Footprints;
  } else if (
    normalized.includes('vista') ||
    normalized.includes('mirador')
  ) {
    IconComponent = Binoculars;
  } else if (normalized.includes('golf')) {
    IconComponent = Goal;
  } else if (
    normalized.includes('ascensor') ||
    normalized.includes('elevador') ||
    normalized.includes('elevator')
  ) {
    IconComponent = ArrowUpDown;
  } else if (
    normalized.includes('yoga') ||
    normalized.includes('meditacion')
  ) {
    IconComponent = PersonStanding;
  } else if (
    normalized.includes('lobby') ||
    normalized.includes('vestibulo') ||
    normalized.includes('recepcion') ||
    normalized.includes('concierge')
  ) {
    IconComponent = ConciergeBell;
  } else if (normalized.includes('acceso')) {
    IconComponent = DoorOpen;
  } else if (
    normalized.includes('cowork') ||
    normalized.includes('oficina') ||
    normalized.includes('business') ||
    normalized.includes('sala de juntas')
  ) {
    IconComponent = BriefcaseBusiness;
  } else if (
    normalized.includes('infantil') ||
    normalized.includes('nino') ||
    normalized.includes('kids') ||
    normalized.includes('juegos')
  ) {
    IconComponent = Baby;
  } else if (
    normalized.includes('seguridad') ||
    normalized.includes('vigilancia') ||
    normalized.includes('camaras') ||
    normalized.includes('control') ||
    normalized.includes('guardia')
  ) {
    IconComponent = ShieldCheck;
  } else if (
    normalized.includes('transporte') ||
    normalized.includes('shuttle') ||
    normalized.includes('bus') ||
    normalized.includes('traslado')
  ) {
    IconComponent = BusFront;
  } else if (
    normalized.includes('parqueo') ||
    normalized.includes('estacionamiento') ||
    normalized.includes('garaje') ||
    normalized.includes('vehiculo')
  ) {
    IconComponent = CircleParking;
  } else if (
    normalized.includes('mascota') ||
    normalized.includes('pet') ||
    normalized.includes('perro')
  ) {
    IconComponent = PawPrint;
  } else if (
    normalized.includes('jardin') ||
    normalized.includes('sendero') ||
    normalized.includes('verde') ||
    normalized.includes('parque') ||
    normalized.includes('naturaleza')
  ) {
    IconComponent = Trees;
  } else if (
    normalized.includes('social') ||
    normalized.includes('salon') ||
    normalized.includes('casa club') ||
    normalized.includes('eventos')
  ) {
    IconComponent = Users;
  } else if (
    normalized.includes('playa') ||
    normalized.includes('beach') ||
    normalized.includes('solarium') ||
    normalized.includes('terraza')
  ) {
    IconComponent = Umbrella;
  } else if (
    normalized.includes('restaurante') ||
    normalized.includes('cafe') ||
    normalized.includes('gastronomia')
  ) {
    IconComponent = UtensilsCrossed;
  } else if (
    normalized.includes('bar') ||
    normalized.includes('coctel')
  ) {
    IconComponent = Martini;
  } else if (
    normalized.includes('lounge') ||
    normalized.includes('cava')
  ) {
    IconComponent = Wine;
  } else if (
    normalized.includes('spa') ||
    normalized.includes('sauna') ||
    normalized.includes('bienestar') ||
    normalized.includes('relajacion')
  ) {
    IconComponent = Sparkles;
  } else if (
    normalized.includes('wifi') ||
    normalized.includes('internet') ||
    normalized.includes('fibra')
  ) {
    IconComponent = Wifi;
  } else if (
    normalized.includes('cine') ||
    normalized.includes('teatro') ||
    normalized.includes('pantalla')
  ) {
    IconComponent = Tv;
  } else if (
    normalized.includes('bbq') ||
    normalized.includes('parrilla') ||
    normalized.includes('fogata') ||
    normalized.includes('fire pit')
  ) {
    IconComponent = Flame;
  }

  return <IconComponent className={className} strokeWidth={strokeWidth} style={style} />;
}
