import type { PortalProject } from '@/lib/portal-projects';

const LOCAL_BROKER_LOGO = '/brand/ob-brokers-horizontal-azul-recortado.png';

export function localizeDemoDossierAssets<T>(blocks: T, project: PortalProject): T {
  const localImages = [...new Set([project.image, ...(project.gallery || [])])]
    .filter((image): image is string => typeof image === 'string' && image.startsWith('/') && !image.startsWith('//'));
  const fallbackImage = localImages[0] || LOCAL_BROKER_LOGO;
  let imageIndex = 0;

  const visit = (value: unknown, key = ''): unknown => {
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      if (/logo/i.test(key)) return project.brandProfile?.logoUrl?.startsWith('/') ? project.brandProfile.logoUrl : LOCAL_BROKER_LOGO;
      const image = localImages[imageIndex % Math.max(localImages.length, 1)] || fallbackImage;
      imageIndex += 1;
      return image;
    }
    if (Array.isArray(value)) return value.map((entry) => visit(entry, key));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, visit(childValue, childKey)]));
    }
    return value;
  };

  return visit(blocks) as T;
}
