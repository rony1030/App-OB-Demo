import type { AgentProfile } from './types';

export function agentContactLine(agent: AgentProfile) {
  const instagram = agent.instagram ? `@${agent.instagram.replace(/^@/, '')}` : '';
  const socialLinks = agent.socialLinks?.length ? agent.socialLinks : [instagram];
  return [agent.phone, ...socialLinks].filter(Boolean).join(' · ');
}
