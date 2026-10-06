import type { UserRole } from '@/lib/auth/get-user';

export type RoleCapability =
  | 'manage_platform'
  | 'manage_agency'
  | 'manage_agency_users'
  | 'review_broker_access_requests'
  | 'manage_agency_documents'
  | 'manage_project_documents'
  | 'edit_project_dossier'
  | 'create_proposals'
  | 'manage_agreements'
  | 'view_commissions'
  | 'issue_fiscal_invoices'
  | 'manage_commission_claims'
  | 'view_commission_reports'
  | 'manage_projects'
  | 'manage_marketing_offers'
  | 'view_audit';

export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Superadministrador',
  master_broker_admin: 'Administrador principal',
  master_broker_operations: 'Operaciones Master',
  agency_admin: 'Administrador de agencia',
  agency_support: 'Soporte de agencia',
  broker_agent: 'Vendedor / Asesor inmobiliario',
  developer_admin: 'Administrador de desarrollador',
  developer_viewer: 'Consulta de desarrollador',
  support_auditor: 'Auditor de soporte',
};

const roleCapabilities: Record<UserRole, RoleCapability[]> = {
  super_admin: [
    'manage_platform',
    'manage_agency',
    'manage_agency_users',
    'review_broker_access_requests',
    'manage_agency_documents',
    'manage_project_documents',
    'edit_project_dossier',
    'create_proposals',
    'manage_agreements',
    'view_commissions',
    'issue_fiscal_invoices',
    'manage_commission_claims',
    'view_commission_reports',
    'manage_projects',
    'manage_marketing_offers',
    'view_audit',
  ],
  master_broker_admin: [
    'manage_agency',
    'manage_agency_users',
    'review_broker_access_requests',
    'manage_agency_documents',
    'manage_project_documents',
    'create_proposals',
    'manage_agreements',
    'view_commissions',
    'issue_fiscal_invoices',
    'manage_commission_claims',
    'view_commission_reports',
    'manage_projects',
    'manage_marketing_offers',
    'view_audit',
  ],
  master_broker_operations: [
    'review_broker_access_requests',
    'manage_agency_documents',
    'manage_project_documents',
    'create_proposals',
    'manage_agreements',
    'manage_projects',
    'manage_marketing_offers',
    'manage_commission_claims',
    'view_commission_reports',
  ],
  agency_admin: [
    'manage_agency',
    'manage_agency_users',
    'manage_agency_documents',
    'manage_project_documents',
    'create_proposals',
    'manage_commission_claims',
  ],
  agency_support: [
    'manage_agency_documents',
    'manage_project_documents',
    'create_proposals',
  ],
  broker_agent: ['create_proposals', 'manage_commission_claims'],
  developer_admin: ['manage_project_documents', 'manage_projects', 'view_commission_reports'],
  developer_viewer: ['view_commission_reports'],
  support_auditor: ['view_audit'],
};

export function hasCapability(role: UserRole | null | undefined, capability: RoleCapability) {
  return !!role && roleCapabilities[role]?.includes(capability);
}

export function canInviteRole(actorRole: UserRole | null | undefined, targetRole: UserRole) {
  if (!actorRole) return false;
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'master_broker_admin') {
    return targetRole !== 'super_admin';
  }
  if (actorRole === 'agency_admin') {
    return ['agency_support', 'broker_agent'].includes(targetRole);
  }
  if (actorRole === 'agency_support') {
    return targetRole === 'broker_agent';
  }
  return false;
}

export function canManageMembershipStatus(actorRole: UserRole | null | undefined, targetRole?: string) {
  if (!actorRole) return false;
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'master_broker_admin') return targetRole !== 'super_admin';
  if (actorRole === 'agency_admin') return ['agency_support', 'broker_agent'].includes(targetRole || '');
  if (actorRole === 'agency_support') return targetRole === 'broker_agent';
  return false;
}
