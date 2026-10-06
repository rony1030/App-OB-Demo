export type UnitStatus = 'available' | 'reserved' | 'sold' | 'blocked';

export interface ProjectUnit {
  id: string;
  project_id: string;
  unit_number: string;
  building_or_tower?: string;
  floor_level: number;
  typology: string; // e.g. '1BR Suite', '2BR Luxury', '3BR Penthouse', 'Villa'
  bedrooms: number;
  bathrooms: number;
  indoor_sqm: number;
  terrace_sqm?: number;
  total_sqm: number;
  price: number;
  currency: 'USD' | 'DOP' | 'EUR';
  status: UnitStatus;
  reserved_by_broker_id?: string;
  reserved_client_name?: string;
  reservation_expires_at?: string;
  floor_plan_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MasterBrokerProject {
  id: string;
  name: string;
  slug: string;
  developer_name: string;
  location: string;
  zone: string; // e.g. 'Punta Cana', 'Cap Cana', 'Santo Domingo'
  delivery_date: string;
  status: 'pre_construction' | 'under_construction' | 'ready_to_deliver';
  hero_image: string;
  gallery_images: string[];
  description: string;
  amenities: string[];
  total_units_count: number;
  available_units_count: number;
  starting_price: number;
  commission_percentage: number; // e.g. 5% or 6%
  master_broker_exclusive: boolean;
  brochure_url?: string;
  dossier_url?: string;
  virtual_tour_url?: string;
  created_at: string;
  updated_at: string;
}
