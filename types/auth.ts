export type AppRole = 
  | 'super_admin'           // SaaS Platform Owner
  | 'master_broker_admin'   // Master Broker Principal (Executive)
  | 'master_broker_operations'
  | 'agency_admin'          // Agency administrator
  | 'agency_support'        // Agency support operator
  | 'broker_agent'          // Real estate advisor / seller
  | 'developer_admin'
  | 'developer_viewer'
  | 'support_auditor';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  phone?: string;
  avatar_url?: string;
  agency_id?: string;
  agency_name?: string;
  agency_logo?: string;
  permissions: {
    can_manage_projects: boolean;
    can_edit_availability: boolean;
    can_create_proposals: boolean;
    can_manage_all_leads: boolean;
    can_manage_network: boolean;
    can_view_reports: boolean;
  };
}
