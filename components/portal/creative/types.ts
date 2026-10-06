export interface CanvasObjectLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  locked?: boolean;
}

export type AspectRatio = 'portrait' | 'square';

export type SignatureFontKey = 'dancing' | 'greatvibes';

export type StylePreset = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface AgentProfile {
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  instagram: string;
  socialLinks: string[];
  avatarUrl: string | null;
  signatureFont: SignatureFontKey;
}

export interface AmenityItem {
  id: string;
  label: string;
}

export interface CoverSlideData {
  title: string;
  subtitle: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  price: number;
  currency?: string;
  priceLabel: string;
  imageUrl: string;
  features: AmenityItem[];
  showPrice: boolean;
  elements?: Record<string, CanvasObjectLayout>;
}

export interface ContentSlideData {
  title: string;
  subtitle: string;
  imageUrl: string;
  position: 'left' | 'right';
  elements?: Record<string, CanvasObjectLayout>;
}

export interface AmenitiesSlideData {
  title: string;
  subtitle: string;
  amenities: AmenityItem[];
  imageUrl: string;
  elements?: Record<string, CanvasObjectLayout>;
}

export interface ClosingSlideData {
  headline: string;
  price: number;
  currency?: string;
  priceLabel: string;
  ctaText: string;
  agent: AgentProfile;
  elements?: Record<string, CanvasObjectLayout>;
}

export interface CarouselProjectData {
  id: string;
  propertyName: string;
  location: string;
  aspectRatio: AspectRatio;
  stylePreset: StylePreset;
  footerLogoUrl: string | null;
  showFooterLogo: boolean;
  slide1: CoverSlideData;
  contentSlides: ContentSlideData[];
  slide4: AmenitiesSlideData;
  slide5: ClosingSlideData;
}

export const CANVAS_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  portrait: { width: 540, height: 675 },
  square: { width: 540, height: 540 },
};
