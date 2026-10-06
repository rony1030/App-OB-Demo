import { Building2, Bus, Dumbbell, Flame, ShieldCheck, Utensils, Waves, Zap, CarFront, TreePine, Baby, HeartPulse, Sun, Wine, Wifi, Footprints } from 'lucide-react';

function iconKeyFor(name: string) {
  const value = name.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (value.includes('piscina') || value.includes('solarium') || value.includes('pool')) return 'pool';
  if (value.includes('jacuzzi') || value.includes('spa') || value.includes('hidro')) return 'jacuzzi';
  if (value.includes('gimnasio') || value.includes('fitness') || value.includes('gym')) return 'gym';
  if (value.includes('sauna') || value.includes('turco') || value.includes('vapor')) return 'sauna';
  if (value.includes('bbq') || value.includes('barbacoa') || value.includes('parrilla') || value.includes('social')) return 'bbq';
  if (value.includes('shuttle') || value.includes('playa') || value.includes('transporte')) return 'shuttle';
  if (value.includes('ascensor') || value.includes('elevador') || value.includes('bloque')) return 'elevator';
  if (value.includes('carga') || value.includes('ev') || value.includes('electr')) return 'ev';
  if (value.includes('seguridad') || value.includes('acceso') || value.includes('24/7') || value.includes('vigilancia')) return 'security';
  if (value.includes('estacionamiento') || value.includes('parqueo') || value.includes('parking') || value.includes('garage')) return 'parking';
  if (value.includes('terraza') || value.includes('rooftop') || value.includes('deck') || value.includes('mirador')) return 'terrace';
  if (value.includes('juego') || value.includes('infantil') || value.includes('nino') || value.includes('kids')) return 'kids';
  if (value.includes('yoga') || value.includes('zen') || value.includes('medita') || value.includes('bienestar')) return 'yoga';
  if (value.includes('verde') || value.includes('recreativ') || value.includes('jardin') || value.includes('parque') || value.includes('paisaj')) return 'green';
  if (value.includes('wifi') || value.includes('inter')) return 'wifi';
  if (value.includes('bar') || value.includes('lounge') || value.includes('trago')) return 'bar';
  if (value.includes('sender') || value.includes('camin')) return 'trail';
  return 'green';
}

export function UveAmenityIcon({ name, className = 'h-5 w-5', style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const props = { 'aria-hidden': true, className, strokeWidth: 1.7, style } as const;
  switch (iconKeyFor(name)) {
    case 'pool': return <Waves {...props} />;
    case 'jacuzzi': return <Waves {...props} />;
    case 'gym': return <Dumbbell {...props} />;
    case 'sauna': return <Flame {...props} />;
    case 'bbq': return <Utensils {...props} />;
    case 'shuttle': return <Bus {...props} />;
    case 'elevator': return <Building2 {...props} />;
    case 'ev': return <Zap {...props} />;
    case 'security': return <ShieldCheck {...props} />;
    case 'parking': return <CarFront {...props} />;
    case 'terrace': return <Sun {...props} />;
    case 'kids': return <Baby {...props} />;
    case 'yoga': return <HeartPulse {...props} />;
    case 'green': return <TreePine {...props} />;
    case 'wifi': return <Wifi {...props} />;
    case 'bar': return <Wine {...props} />;
    case 'trail': return <Footprints {...props} />;
    default: return <TreePine {...props} />;
  }
}
