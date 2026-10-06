export interface PaymentPlanStep {
  label: string;
  percentage: number;
  amount: number;
  due_date_or_milestone: string;
}

export interface ProposalPropertyItem {
  id: string;
  property_id?: string;
  project_name: string;
  /** Developer ownership is frozen with the proposal to keep multi-unit comparisons coherent. */
  developer_name?: string;
  unit_name?: string;
  unit_id?: string;
  typology_id?: string;
  typology_name?: string;
  typology_bedrooms?: number;
  typology_bathrooms?: number;
  typology_area_sqm?: number;
  typology_parking_spaces?: number;
  typology_image?: string;
  typology_floor_plan_image?: string;
  typology_description?: string;
  location: string;
  /** Official price before an authorized marketing discount. */
  list_price?: number;
  price: number;
  applied_discount_type?: 'percent' | 'amount';
  applied_discount_percent?: number;
  applied_discount_amount?: number;
  currency: 'USD' | 'DOP' | 'EUR';
  bedrooms: number;
  bathrooms: number;
  parking_spaces?: number;
  area_sqm: number;
  delivery_date: string;
  description: string;
  hero_image: string;
  gallery_images: string[];
  amenities: string[];
  /** Icon selections frozen with the proposal so later project edits never alter it. */
  amenity_icon_map?: Record<string, string>;
  payment_plan: {
    reservation_amount: number;
    initial_percentage: number;
    during_construction_percentage: number;
    upon_delivery_percentage: number;
    steps?: PaymentPlanStep[];
  };
  roi_projections?: {
    estimated_daily_rate: number;
    projected_occupancy_rate: number; // e.g. 70
    annual_gross_income: number;
    maintenance_and_expenses: number;
    estimated_net_yield_percentage: number; // e.g. 9.5
  };
  virtual_tour_url?: string;
  video_url?: string;
  brochure_url?: string;
}

export interface MultiPropertyProposal {
  id: string;
  token: string;
  title: string;
  subtitle?: string;
  client_name: string;
  recipient_type?: 'person' | 'company';
  client_email?: string;
  client_phone?: string;
  broker_id: string;
  broker_name: string;
  broker_email: string;
  broker_phone: string;
  broker_avatar?: string;
  agency_name?: string;
  agency_logo?: string;
  brand_primary?: string;
  brand_accent?: string;
  brand_surface?: string;
  items: ProposalPropertyItem[];
  applied_offer?: {
    id: number;
    title: string;
    offer_type: 'discount' | 'promotion';
    discount_percent?: number | null;
    promotion_text?: string | null;
  };
  presentation_mode: 'comparative' | 'cards' | 'magazine';
  status: 'draft' | 'ready' | 'published' | 'sent' | 'viewed' | 'negotiation' | 'negotiating' | 'accepted' | 'rejected' | 'closed' | 'expired' | 'revoked';
  views_count: number;
  last_viewed_at?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}
