export type PortalUnitStatus = 'Disponible' | 'Separada' | 'Vendida' | 'Bloqueada';

export interface PortalUnit {
  id: string;
  typologyId?: string | null;
  unit: string;
  tower: string;
  floor: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number;
  currency?: string;
  status: PortalUnitStatus;
  isPublic?: boolean;
  notes?: string | null;
  customColumns?: Record<string, string>;
}

export interface PortalLot {
  id: string;
  code: string;
  block: string;
  areaSqm: number;
  price: number;
  currency?: string;
  status: PortalUnitStatus;
  isPublic?: boolean;
  polygon: { lat: number; lng: number }[];
}

export interface PortalProjectDocument {
  id: string;
  documentVersionId: number | null;
  name: string;
  category: 'Comercial' | 'Legal' | 'Técnico' | 'Bancario';
  format: string;
  version: number | null;
  visibility: 'public' | 'authorized' | 'private';
  status: 'draft' | 'review' | 'approved' | 'published' | 'replaced' | 'archived';
  checksum: string | null;
  updated: string;
  storageBucket: string | null;
  storagePath: string | null;
}

export interface PortalProjectTypology {
  id: string;
  key?: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  totalSqm: number;
  startingPrice?: number;
  parkingSpaces?: number;
  image?: string;
  floorPlanImage?: string;
  description?: string;
  features?: string[];
}

export interface PortalProject {
  id: number;
  slug: string;
  name: string;
  developer: string;
  /** Optional developer-owned identity used by proposals and project presentations. */
  brandProfile?: {
    name?: string;
    primaryColor?: string;
    accentColor?: string;
    surfaceColor?: string;
    logoUrl?: string;
  };
  /** Visual identity resolved from the project's public landing configuration. */
  landingTheme?: {
    primaryColor: string;
    accentColor: string;
    fontPreset: 'modern' | 'minimal' | 'luxury';
    logoUrl?: string | null;
    experiencePreset?: 'residential-villas' | 'cana-rock-resort' | 'uve-residences' | 'palm-view' | 'paridera-bonita-beach';
  };
  landingAmenities?: string[];
  location: string;
  zone: string;
  status: string;
  delivery: string;
  /** ISO delivery date used for date-sensitive calculations and documents. */
  deliveryDate?: string | null;
  startingPrice: number;
  currency?: string;
  commission: number;
  totalUnits: number;
  availableUnits: number;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  highlights: string[];
  amenities: string[];
  paymentPlan: { label: string; value: string }[];
  documents: PortalProjectDocument[];
  typologies?: PortalProjectTypology[];
  units: PortalUnit[];
  projectType: 'building' | 'land_subdivision';
  lots: PortalLot[];
  googleSheetUrl?: string | null;
  digitalFolderUrl?: string | null;
  customColumnsList?: string[];
  updatedAt: string;
  isLocalPreview?: boolean;
  inventorySourceLabel?: string;
  sourceUrl?: string;
}
