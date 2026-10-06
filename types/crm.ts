export type LeadStage = 
  | 'new'
  | 'contacted'
  | 'proposal_sent'
  | 'meeting_scheduled'
  | 'in_negotiation'
  | 'reserved'
  | 'closed_won'
  | 'closed_lost';

export interface BrokerLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country?: string;
  budget_min?: number;
  budget_max?: number;
  currency: 'USD' | 'DOP' | 'EUR';
  interested_projects: string[];
  stage: LeadStage;
  assigned_broker_id: string;
  assigned_agency_id?: string;
  proposals_count: number;
  last_interaction_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AlliedAgency {
  id: string;
  name: string;
  logo_url: string;
  primary_color?: string;
  director_name: string;
  email: string;
  phone: string;
  brokers_count: number;
  total_sales_volume: number;
  status: 'active' | 'pending' | 'suspended';
  commission_split_percentage: number; // e.g. 50 (50/50 split) or 60/40
  created_at: string;
}
