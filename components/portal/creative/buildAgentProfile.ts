import type { CurrentSessionUser, UserRole } from '@/lib/auth/get-user';
import type { AgentProfile } from './types';

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrador',
  master_broker_admin: 'Master Broker',
  master_broker_operations: 'Operaciones · Master Broker',
  agency_admin: 'Administrador de Agencia',
  agency_support: 'Soporte de Agencia',
  broker_agent: 'Asesor Inmobiliario',
  developer_admin: 'Desarrollador',
  developer_viewer: 'Desarrollador (Lectura)',
  support_auditor: 'Auditoría',
};

export const FALLBACK_AGENT_PROFILE: AgentProfile = {
  name: 'Asesor OB Brokers',
  role: 'Broker Asociado',
  phone: null,
  email: null,
  instagram: '',
  socialLinks: [],
  avatarUrl: null,
  signatureFont: 'dancing',
};

function cleanSocial(value: string | null | undefined) {
  return (value || '').trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

export function buildAgentProfile(user: CurrentSessionUser | null): AgentProfile | undefined {
  if (!user) return undefined;
  const instagram = cleanSocial(user.instagramUrl).replace(/^instagram\.com\//i, '').replace(/^@/, '');
  const socialLinks = [
    instagram ? `@${instagram}` : '',
    cleanSocial(user.linkedinUrl),
    cleanSocial(user.facebookUrl),
    cleanSocial(user.tiktokUrl),
    cleanSocial(user.websiteUrl),
  ].filter(Boolean);

  return {
    name: user.displayName,
    role: ROLE_LABELS[user.role] || user.role,
    phone: user.phone,
    email: user.email || null,
    instagram,
    socialLinks,
    avatarUrl: user.avatarUrl && /^https?:\/\//.test(user.avatarUrl) ? user.avatarUrl : null,
    signatureFont: 'dancing',
  };
}
