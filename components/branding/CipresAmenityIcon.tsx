import { CarFront, Dumbbell, Flower2, HeartPulse, Home, ShieldCheck, Trees, Waves } from 'lucide-react';

function iconFor(name: string, className: string, style?: React.CSSProperties) {
  const value = name.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const props = { 'aria-hidden': true, className, strokeWidth: 1.7, style } as const;
  if (value.includes('piscina') || value.includes('agua')) return <Waves {...props} />;
  if (value.includes('parque') || value.includes('estacion')) return <CarFront {...props} />;
  if (value.includes('seguridad') || value.includes('acceso')) return <ShieldCheck {...props} />;
  if (value.includes('verde') || value.includes('jardin') || value.includes('natur')) return <Trees {...props} />;
  if (value.includes('gimnas') || value.includes('deport')) return <Dumbbell {...props} />;
  if (value.includes('casa') || value.includes('club') || value.includes('vestib')) return <Home {...props} />;
  if (value.includes('spa') || value.includes('sauna') || value.includes('yoga')) return <HeartPulse {...props} />;
  return <Flower2 {...props} />;
}

export function CipresAmenityIcon({ name, className = 'h-5 w-5', style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return iconFor(name, className, style);
}
