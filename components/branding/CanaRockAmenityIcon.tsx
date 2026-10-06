import icons from '@/lib/data/cana-rock-amenity-icons.json';
import type { LucideIcon } from 'lucide-react';
import {
  Accessibility, Activity, Award, Baby, Bath, BedDouble, Bike, Building2, Car, Coffee, Dumbbell, Fence, Flame,
  Flower2, Gamepad2, HeartPulse, KeyRound, LandPlot, MapPin, Martini, PawPrint, PersonStanding, Plane,
  ShieldCheck, ShoppingBag, Smartphone, Sun, TrainFront, Trees, Utensils, Waves, Wifi, Wind, Zap,
} from 'lucide-react';

const iconByAmenity: Array<[string, string]> = [
  ['gimnasio', 'gym'],
  ['gym', 'gym'],
  ['seguridad', 'security'],
  ['ascensor', 'elevators'],
  ['elevador', 'elevators'],
  ['vestibulo', 'main-lobby'],
  ['lobby', 'main-lobby'],
  ['yoga', 'yoga'],
  ['golf', 'golf'],
  ['minigolf', 'golf'],
  ['infantil', 'kids'],
  ['juego', 'kids'],
  ['nino', 'kids'],
  ['restaurante', 'bar'],
  ['bar', 'bar'],
  ['bbq', 'fire'],
  ['parrilla', 'fire'],
  ['parqueo', 'car'],
  ['estacionamiento', 'car'],
  ['aparcamiento', 'car'],
  ['parking', 'car'],
  ['piscina', 'pool'],
  ['swim-up', 'pool-bar'],
  ['cowork', 'coworking'],
  ['cancha', 'sports-court'],
  ['tenis', 'tennis'],
  ['pádel', 'paddle'],
  ['padel', 'paddle'],
  ['sendero', 'trails'],
  ['lago', 'lake'],
  ['vista al golf', 'golf-view'],
  ['cine', 'cinema'],
  ['lavander', 'laundry'],
  ['generador', 'generator'],
  ['planta electrica', 'generator'],
  ['jacuzzi', 'pool'],
  ['spa', 'spa'],
  ['sauna', 'fire'],
  ['shuttle', 'transport'],
  ['playa', 'sun'],
  ['terraza', 'sun'],
  ['rooftop', 'sun'],
  ['verde', 'trees'],
  ['recreativ', 'trees'],
  ['jardin', 'garden'],
];

export const CANA_ROCK_ICON_OPTIONS: ReadonlyArray<{ key: string; label: string; category?: string }> = [
  { key: 'pool', label: 'Piscina', category: 'Agua y bienestar' },
  { key: 'pool-bar', label: 'Piscina con bar', category: 'Agua y bienestar' },
  { key: 'gym', label: 'Gimnasio', category: 'Deporte' },
  { key: 'bar', label: 'Restaurante / Bar' },
  { key: 'golf', label: 'Golf / Minigolf' },
  { key: 'golf-cart-parking', label: 'Carritos de Golf' },
  { key: 'car', label: 'Parqueo' },
  { key: 'security', label: 'Seguridad 24/7' },
  { key: 'elevators', label: 'Ascensores' },
  { key: 'main-lobby', label: 'Lobby Principal' },
  { key: 'kids', label: 'Zona Infantil' },
  { key: 'yoga', label: 'Área de Yoga' },
  { key: 'coworking', label: 'Coworking', category: 'Servicios' },
  { key: 'clubhouse', label: 'Casa club', category: 'Social' },
  { key: 'concierge', label: 'Conserjería', category: 'Servicios' },
  { key: 'sports-court', label: 'Cancha deportiva', category: 'Deporte' },
  { key: 'tennis', label: 'Tenis', category: 'Deporte' },
  { key: 'paddle', label: 'Pádel', category: 'Deporte' },
  { key: 'basketball', label: 'Baloncesto', category: 'Deporte' },
  { key: 'soccer', label: 'Fútbol', category: 'Deporte' },
  { key: 'playground', label: 'Parque infantil', category: 'Familia' },
  { key: 'cinema', label: 'Sala de cine', category: 'Social' },
  { key: 'event-room', label: 'Salón de eventos', category: 'Social' },
  { key: 'rooftop', label: 'Rooftop', category: 'Social' },
  { key: 'terrace', label: 'Terraza', category: 'Social' },
  { key: 'trails', label: 'Senderos', category: 'Naturaleza' },
  { key: 'beach', label: 'Playa', category: 'Naturaleza' },
  { key: 'lake', label: 'Lago', category: 'Naturaleza' },
  { key: 'golf-view', label: 'Vista al golf', category: 'Naturaleza' },
  { key: 'sauna', label: 'Sauna', category: 'Agua y bienestar' },
  { key: 'massage', label: 'Masajes', category: 'Agua y bienestar' },
  { key: 'bbq', label: 'Área BBQ', category: 'Social' },
  { key: 'generator', label: 'Planta eléctrica', category: 'Servicios' },
  { key: 'water-treatment', label: 'Tratamiento de agua', category: 'Servicios' },
  { key: 'laundry', label: 'Lavandería', category: 'Servicios' },
  { key: 'ev-charger', label: 'Carga eléctrica', category: 'Servicios' },
  { key: 'location', label: 'Ubicación' },
  { key: 'building', label: 'Edificio' },
  { key: 'house', label: 'Casa' },
  { key: 'bedroom', label: 'Habitación' },
  { key: 'bathroom', label: 'Baño' },
  { key: 'parking', label: 'Estacionamiento' },
  { key: 'garden', label: 'Jardín' },
  { key: 'trees', label: 'Áreas verdes' },
  { key: 'sun', label: 'Sol' },
  { key: 'waves', label: 'Agua' },
  { key: 'spa', label: 'Spa' },
  { key: 'health', label: 'Bienestar' },
  { key: 'accessibility', label: 'Accesibilidad' },
  { key: 'baby', label: 'Bebés' },
  { key: 'game', label: 'Juegos' },
  { key: 'bike', label: 'Bicicleta' },
  { key: 'walk', label: 'Caminata' },
  { key: 'coffee', label: 'Café' },
  { key: 'restaurant', label: 'Restaurante' },
  { key: 'martini', label: 'Bar' },
  { key: 'shopping', label: 'Compras' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'electric', label: 'Electricidad' },
  { key: 'key', label: 'Acceso' },
  { key: 'smart-home', label: 'Tecnología' },
  { key: 'fence', label: 'Residencial cerrado' },
  { key: 'airport', label: 'Aeropuerto' },
  { key: 'transport', label: 'Transporte' },
  { key: 'pets', label: 'Mascotas' },
  { key: 'sparkles', label: 'Calidad' },
  { key: 'activity', label: 'Actividad' },
  { key: 'fire', label: 'Fogata' },
];

const lucideIcons: Record<string, LucideIcon> = {
  location: MapPin, building: Building2, house: LandPlot, bedroom: BedDouble, bathroom: Bath,
  parking: Car, garden: Flower2, trees: Trees, sun: Sun, waves: Waves, spa: Flower2,
  health: HeartPulse, accessibility: Accessibility, baby: Baby, game: Gamepad2, bike: Bike,
  walk: PersonStanding, coffee: Coffee, restaurant: Utensils, martini: Martini, shopping: ShoppingBag,
  wifi: Wifi, electric: Zap, key: KeyRound, security: ShieldCheck, 'smart-home': Smartphone,
  fence: Fence, airport: Plane, transport: TrainFront, pets: PawPrint, sparkles: Award,
  activity: Activity, fire: Flame, car: Car, gym: Dumbbell,
  pool: Waves, 'pool-bar': Waves, coworking: Building2, clubhouse: Building2, concierge: KeyRound,
  'sports-court': Activity, tennis: Activity, paddle: Activity, basketball: Activity, soccer: Activity,
  playground: Gamepad2, cinema: Smartphone, 'event-room': Martini, rooftop: Sun, terrace: Sun,
  trails: PersonStanding, beach: Sun, lake: Waves, 'golf-view': LandPlot, sauna: Flame,
  massage: Flower2, bbq: Flame, generator: Zap, 'water-treatment': Waves, laundry: Wind,
  'ev-charger': Zap,
};

export function resolveIconKey(name: string) {
  const normalized = name
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return iconByAmenity.find(([keyword]) => normalized.includes(keyword))?.[1] || 'golf';
}

/** The original Cana Rock SVG icon collection, preserved for Cana Rock landings. */
export function CanaRockAmenityIcon({
  name,
  iconKey,
  className = 'h-8 w-7',
  style,
}: {
  name?: string;
  iconKey?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const chosenKey = iconKey || (name ? resolveIconKey(name) : 'golf');
  const icon = icons[chosenKey as keyof typeof icons];

  if (!icon) {
    const Icon = lucideIcons[chosenKey] || Dumbbell;
    return <span aria-hidden="true" className={`block shrink-0 leading-none ${className}`} style={style}><Icon className="h-full w-full" strokeWidth={1.8} /></span>;
  }

  const processedIcon = icon.replace(/fill="#[cC][aA]9[fF]47"/g, 'fill="currentColor"');

  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 leading-none [&>svg]:h-full [&>svg]:w-full [&>svg]:object-contain ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: processedIcon }}
    />
  );
}
