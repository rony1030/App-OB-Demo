import type { PortalProject } from '@/lib/portal-projects';
import { CANA_ROCK_PROJECTS, getCanaRockKey, isCanaRockProject } from '@/lib/portal/cana-rock-dossier';
import { computeProjectCoverSpecs } from '@/lib/portal/project-cover-specs';
import { projectLogoForProposal } from '@/lib/proposals/proposal-template';
import sourceBlocks from '@/lib/portal/dossier-source.json';

/** Copies the saved 21-page dossier design. Only the cover takes project data. */
export function buildDossierTemplate(project: PortalProject): Array<Record<string, unknown>> {
  const blocks = structuredClone(sourceBlocks) as Array<Record<string, unknown>>;
  const cover = blocks[0];
  if (project.slug === 'cana-rock-stelar') return blocks;
  const projectMeta = isCanaRockProject(project) ? CANA_ROCK_PROJECTS[getCanaRockKey(project.slug)] : null;
  const coverImage = project.image || project.gallery?.[0] || projectMeta?.heroImage || '';

  cover.title = project.name;
  cover.body = project.shortDescription || project.description || '';
  cover.image = coverImage;
  cover.images = coverImage ? [coverImage] : [];
  cover.projectLogoUrl = project.landingTheme?.logoUrl || project.brandProfile?.logoUrl || projectMeta?.logoUrl || projectLogoForProposal(project) || '';
  cover.kicker = 'DOSSIER COMERCIAL';
  cover.locationLeft = project.location || '';
  cover.locationRight = project.delivery || '';
  cover.coverSpecs = computeProjectCoverSpecs(project);

  return blocks;
}
