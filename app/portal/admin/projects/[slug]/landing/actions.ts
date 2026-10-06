'use server';

import { revalidatePath } from 'next/cache';
import dns from 'dns/promises';
import {
  saveProjectLandingConfig,
  type ProjectLandingConfig,
} from '@/lib/data/landing-config';
import { getCurrentUser } from '@/lib/auth/get-user';

import { createClient } from '@/lib/supabase/server';

const AUTHORIZED_ROLES = [
  'super_admin',
  'master_broker_admin',
  'master_broker_operations',
  'developer_admin',
];

export async function saveLandingConfigAction(
  projectId: number,
  config: ProjectLandingConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !AUTHORIZED_ROLES.includes(user.role)) {
      return { success: false, error: 'No tienes permisos para modificar la landing de este proyecto.' };
    }

    const supabase = await createClient();

    // Verify project exists and authorization
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id, slug')
      .eq('id', projectId)
      .maybeSingle();

    if (!project) {
      return { success: false, error: 'Proyecto no encontrado.' };
    }

    // A non-super-admin can only edit their own organization projects or linked developer projects
    if (user.role !== 'super_admin' && user.organization?.id) {
      if (project.organization_id !== user.organization.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rel } = await (supabase as any)
          .from('organization_relationships')
          .select('id')
          .or(
            `and(source_organization_id.eq.${user.organization.id},target_organization_id.eq.${project.organization_id}),and(source_organization_id.eq.${project.organization_id},target_organization_id.eq.${user.organization.id})`
          )
          .maybeSingle();

        if (!rel) {
          return { success: false, error: 'No tienes autorización para editar proyectos de otra organización.' };
        }
      }
    }

    // Server-side validation of editorial content
    if (config.profitability?.enabled) {
      if (!config.profitability.title?.trim()) {
        return { success: false, error: 'El título de la sección de rentabilidad no puede estar vacío.' };
      }
      if (config.profitability.title.length > 120) {
        return { success: false, error: 'El título de rentabilidad no debe superar los 120 caracteres.' };
      }
      const validItems = (config.profitability.items || []).filter((it) => it.label?.trim() || it.roi?.trim());
      if (validItems.length === 0) {
        return { success: false, error: 'Debes incluir al menos un escenario de tipología con etiqueta y ROI.' };
      }
    }

    const targetOrgId = project.organization_id || user.organization?.id || 1;
    const res = await saveProjectLandingConfig(projectId, config, targetOrgId);
    if (!res.success) {
      return res;
    }

    // Revalidate public landing and portal routes
    revalidatePath(`/proyectos/${config.projectSlug}`);
    revalidatePath(`/portal/projects/${config.projectSlug}`);
    revalidatePath('/portal/admin/projects', 'layout');
    revalidatePath('/');

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al guardar la configuración',
    };
  }
}

export async function verifyDomainDnsAction(
  domain: string
): Promise<{ verified: boolean; message: string; records?: string[] }> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim().toLowerCase();

  if (!cleanDomain) {
    return { verified: false, message: 'Ingresa un nombre de dominio válido.' };
  }

  try {
    // 1. Try resolving CNAME records
    const cnameRecords = await dns.resolveCname(cleanDomain).catch(() => []);

    const isVercelCname = cnameRecords.some(
      (r) =>
        r.toLowerCase().includes('vercel-dns.com') ||
        r.toLowerCase().includes('vercel.app') ||
        r.toLowerCase().includes('ob-brokers')
    );

    if (isVercelCname) {
      return {
        verified: true,
        message: `¡Dominio configurado correctamente! CNAME apunta a ${cnameRecords.join(', ')}.`,
        records: cnameRecords,
      };
    }

    // 2. Try resolving A records
    const aRecords = await dns.resolve4(cleanDomain).catch(() => []);
    if (aRecords.length > 0) {
      // 76.76.21.21 is Vercel's standard anycast A-record
      const isVercelIp = (aRecords as string[]).includes('76.76.21.21');
      if (isVercelIp) {
        return {
          verified: true,
          message: '¡Dominio verificado con éxito mediante registro A (76.76.21.21)!',
          records: aRecords,
        };
      }

      return {
        verified: false,
        message: `El dominio apunta a las IP(s) [${aRecords.join(', ')}], pero requiere un CNAME a cname.vercel-dns.com o registro A 76.76.21.21.`,
        records: aRecords,
      };
    }

    return {
      verified: false,
      message: `No se encontraron registros CNAME o A para ${cleanDomain}. Si acabas de agregarlo a tu proveedor DNS (Cloudflare, GoDaddy, Namecheap), la propagación puede tardar entre 5 y 30 minutos.`,
    };
  } catch (err: unknown) {
    return {
      verified: false,
      message: `Error al consultar DNS: ${err instanceof Error ? err.message : 'No se pudo resolver el dominio.'}`,
    };
  }
}
