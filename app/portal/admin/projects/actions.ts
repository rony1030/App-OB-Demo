'use server';

import { revalidatePath } from 'next/cache';
import JSZip from 'jszip';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAlterEstateUnits, normalizeAlterEstateUnit } from '@/lib/integrations/inventory/alterestate';
import { getCurrentUser } from '@/lib/auth/get-user';
import {
  processInventoryWithGemini,
  type ExtractedUnit,
  type ChatMessage,
  type GeminiInventoryResponse,
} from '@/lib/ai/inventory-gemini';
import { isGarbageUnitCode } from '@/lib/data/uve-units';
import { normalizeUnitCode } from '@/lib/unit-code';

export type CreateProjectInput = {
  name: string;
  slug?: string;
  developerName?: string;
  location: string;
  zone: string;
  lifecycleStatus: string;
  deliveryDate?: string;
  startingPrice: number;
  currency: string;
  commissionRate: number;
  description: string;
  shortDescription?: string;
  confotur?: boolean;
  heroStoragePath?: string;
  galleryStoragePaths?: string[];
  reservationAmount?: number;
  initialPercentage?: number;
  duringConstructionPercentage?: number;
  uponDeliveryPercentage?: number;
  googleSheetUrl?: string;
  units?: ExtractedUnit[];
};

export async function parseInventoryWithGeminiAction(
  content: string,
  history: ChatMessage[] = []
): Promise<GeminiInventoryResponse> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user || !['super_admin', 'master_broker_admin', 'developer_admin'].includes(user.role)) {
    return { hasDoubts: false, questionForUser: undefined, units: [], summaryText: '' };
  }
  return await processInventoryWithGemini(content, history);
}

export async function createProjectWithFullSuiteAction(
  formData: FormData
): Promise<{ success?: boolean; error?: string; slug?: string }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);

  if (!currentUser) {
    return { error: 'Debes iniciar sesión para crear un proyecto.' };
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    return { error: 'No tienes permisos para crear proyectos.' };
  }

  const orgId = currentUser.organization.id;

  const name = String(formData.get('name') || '').trim();
  let slug = String(formData.get('slug') || '').trim().toLowerCase();
  const developerName = String(formData.get('developerName') || 'Desarrollador Oficial').trim();
  const location = String(formData.get('location') || '').trim();
  const zone = String(formData.get('zone') || 'Punta Cana').trim();
  const lifecycleStatus = String(formData.get('lifecycleStatus') || 'under_construction').trim();
  const deliveryDate = String(formData.get('deliveryDate') || '2026-12-31').trim();
  const startingPrice = Number(formData.get('startingPrice') || 0);
  const currency = String(formData.get('currency') || '').trim().toUpperCase();
  const commissionRate = Number(formData.get('commissionRate') || 6);
  const description = String(formData.get('description') || '').trim();
  const shortDescription = String(formData.get('shortDescription') || '').trim();
  const heroStoragePath = String(formData.get('heroStoragePath') || '').trim();
  const galleryStoragePathsRaw = String(formData.get('galleryStoragePaths') || '[]').trim();
  const googleSheetUrl = String(formData.get('googleSheetUrl') || '').trim();

  // Payment plan steps
  const reservationAmount = Number(formData.get('reservationAmount') || 5000);
  const initialPercentage = Number(formData.get('initialPercentage') || 20);
  const duringConstruction = Number(formData.get('duringConstructionPercentage') || 40);
  const uponDelivery = Number(formData.get('uponDeliveryPercentage') || 40);

  if (!name || !location || !currency) {
    return { error: 'Nombre, ubicación y moneda son campos obligatorios.' };
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    return { error: 'La moneda debe ser un código ISO de tres letras, por ejemplo USD, DOP, EUR o CAD.' };
  }

  let galleryStoragePaths: string[] = [];
  try {
    const parsedPaths: unknown = JSON.parse(galleryStoragePathsRaw);
    if (!Array.isArray(parsedPaths) || !parsedPaths.every((path) => typeof path === 'string')) {
      return { error: 'La lista de imágenes de la galería no es válida.' };
    }
    galleryStoragePaths = parsedPaths;
  } catch {
    return { error: 'La lista de imágenes de la galería no es válida.' };
  }

  const expectedMediaPrefix = `${currentUser.organization.slug}/projects/`;
  const isAllowedMediaPath = (path: string) =>
    path.startsWith(expectedMediaPrefix) &&
    !path.includes('..') &&
    /\.(?:jpe?g|png|webp)$/i.test(path);

  const submittedMediaPaths = [heroStoragePath, ...galleryStoragePaths].filter(Boolean);
  if (submittedMediaPaths.some((path) => !isAllowedMediaPath(path))) {
    return { error: 'Una o más rutas de imágenes no pertenecen a tu organización.' };
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // 1. Get or create Developer organization
  let developerOrgId = orgId;
  if (developerName && developerName !== 'Desarrollador Oficial') {
    const { data: devOrg } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', developerName)
      .maybeSingle();

    if (devOrg) {
      developerOrgId = devOrg.id;
    } else {
      const devSlug =
        developerName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

      const { data: newDev } = await supabase
        .from('organizations')
        .insert({
          name: developerName,
          slug: devSlug,
          kind: 'developer',
          status: 'active',
        })
        .select('id')
        .maybeSingle();

      if (newDev?.id) {
        developerOrgId = newDev.id;
      }
    }
  }

  // Ensure slug uniqueness
  const { data: existingProject } = await supabase
    .from('projects')
    .select('id')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .maybeSingle();

  if (existingProject) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // 2. Insert Project
  const { error: projectError } = await supabase
    .from('projects')
    .insert({
      organization_id: orgId,
      developer_organization_id: developerOrgId,
      slug,
      name,
      location,
      zone,
      lifecycle_status: lifecycleStatus,
      publication_status: 'published',
      delivery_date: deliveryDate ? `${deliveryDate}-01` : null,
      starting_price: startingPrice,
      currency,
      commission_rate: commissionRate,
      master_broker_exclusive: true,
      description,
      short_description: shortDescription || description.slice(0, 140),
      inventory_total_declared: 0,
      inventory_available_declared: 0,
      published_at: new Date().toISOString(),
    });

  if (projectError) {
    return { error: `Error creando proyecto: ${projectError?.message || 'Error desconocido'}` };
  }

  // Read the inserted row in a separate statement. The authenticated SELECT
  // policy resolves project access through private.can_view_project(id), which
  // cannot see the new row while PostgreSQL is still evaluating INSERT RETURNING.
  const { data: project, error: projectLookupError } = await supabase
    .from('projects')
    .select('id, slug')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .single();

  if (projectLookupError || !project) {
    return {
      error: `El proyecto fue creado, pero no se pudo recuperar para completar su configuración: ${projectLookupError?.message || 'Error desconocido'}`,
    };
  }

  const projectId = project.id;

  // 3. Insert Payment Plan
  const { data: plan } = await supabase
    .from('payment_plans')
    .insert({
      organization_id: orgId,
      project_id: projectId,
      name: 'Plan de Pago Estándar',
      currency,
      is_active: true,
    })
    .select('id')
    .single();

  if (plan) {
    const { error: stepsError } = await supabase.from('payment_plan_steps').insert([
      {
        payment_plan_id: plan.id,
        label: 'Reserva',
        fixed_amount: reservationAmount,
        percentage: 0,
        sort_order: 1,
      },
      {
        payment_plan_id: plan.id,
        label: 'Inicial / Contrato',
        percentage: initialPercentage,
        sort_order: 2,
      },
      {
        payment_plan_id: plan.id,
        label: 'Durante Construcción',
        percentage: duringConstruction,
        sort_order: 3,
      },
      {
        payment_plan_id: plan.id,
        label: 'Contra Entrega',
        percentage: uponDelivery,
        sort_order: 4,
      },
    ]);
    if (stepsError) {
      console.error('createProjectWithFullSuiteAction: payment_plan_steps insert failed', stepsError);
    }
  } else {
    console.error('createProjectWithFullSuiteAction: payment_plans insert failed, no plan.id returned');
  }

  // 4. Register media already uploaded directly to Supabase Storage.
  const mediaInserts: Array<{
    organization_id: number;
    project_id: number;
    kind: string;
    storage_bucket: string;
    storage_path: string;
    alt_text: string;
    sort_order: number;
  }> = [];

  if (heroStoragePath) {
    mediaInserts.push({
      organization_id: orgId,
      project_id: projectId,
      kind: 'hero',
      storage_bucket: 'public-assets',
      storage_path: heroStoragePath,
      alt_text: `Fachada principal de ${name}`,
      sort_order: 0,
    });
  }

  if (galleryStoragePaths.length > 0) {
    for (let i = 0; i < galleryStoragePaths.length; i++) {
      mediaInserts.push({
        organization_id: orgId,
        project_id: projectId,
        kind: 'gallery',
        storage_bucket: 'public-assets',
        storage_path: galleryStoragePaths[i],
        alt_text: `Render ${i + 1} de ${name}`,
        sort_order: i + 1,
      });
    }
  }

  if (mediaInserts.length > 0) {
    const { error: mediaError } = await supabase.from('project_media').insert(mediaInserts);
    if (mediaError) {
      console.warn('Advertencia al insertar media del proyecto:', mediaError.message);
    }
  }

  const unitsJson = String(formData.get('unitsJson') || '').trim();

  // 5. Ingest Units (From Gemini AI / Manual, Google Sheets, or default generated)
  let unitsCreated = false;

  if (unitsJson) {
    try {
      const parsedUnits: ExtractedUnit[] = JSON.parse(unitsJson);
      if (Array.isArray(parsedUnits) && parsedUnits.length > 0) {
        // Base typology
        let { data: defaultTypology } = await supabase
          .from('typologies')
          .select('id')
          .eq('project_id', projectId)
          .limit(1)
          .maybeSingle();

        if (!defaultTypology) {
          const { data: newTyp, error: typError } = await supabase
            .from('typologies')
            .insert({
              organization_id: orgId,
              project_id: projectId,
              name: 'Residencia Estándar',
              bedrooms: 2,
              bathrooms: 2,
              total_sqm: 85,
            })
            .select('id')
            .single();
          if (typError) console.error('createProjectWithFullSuiteAction: typologies insert failed', typError);
          defaultTypology = newTyp;
        }

        const typologyId = defaultTypology?.id;
        if (typologyId) {
          let availableCount = 0;
          let unitFailures = 0;
          for (const u of parsedUnits) {
            const statusMap: Record<string, string> = {
              available: 'available',
              reserved: 'separated',
              sold: 'sold',
            };
            const dbStatus = statusMap[u.status] || 'available';
            if (dbStatus === 'available') availableCount++;

            const { error: unitError } = await supabase.from('units').upsert(
              {
                organization_id: orgId,
                project_id: projectId,
                typology_id: typologyId,
                unit_code: u.unit_code,
                floor_level: u.floor_level || 1,
                list_price: u.price || startingPrice || 185000,
                status: dbStatus,
                currency,
              },
              { onConflict: 'project_id,unit_code' }
            );
            if (unitError) {
              unitFailures++;
              console.error('createProjectWithFullSuiteAction: units upsert failed', u.unit_code, unitError);
            }
          }
          if (unitFailures > 0) {
            console.error(`createProjectWithFullSuiteAction: ${unitFailures}/${parsedUnits.length} unit upserts failed`);
          }

          const { error: invError } = await supabase
            .from('projects')
            .update({
              inventory_total_declared: parsedUnits.length,
              inventory_available_declared: availableCount,
              inventory_updated_at: new Date().toISOString(),
            })
            .eq('id', projectId);
          if (invError) console.error('createProjectWithFullSuiteAction: inventory count update failed', invError);

          unitsCreated = true;
        }
      }
    } catch (e) {
      console.warn('Error parsing unitsJson in createProjectAction:', e);
    }
  }

  if (!unitsCreated && googleSheetUrl) {
    const syncRes = await syncGoogleSheetInventory(projectId, googleSheetUrl);
    if (syncRes.success && (syncRes.count || 0) > 0) {
      unitsCreated = true;
    }
  }

  // Do not create demo inventory. A project without imported units must remain 0/0.

  revalidatePath('/portal/projects');
  revalidatePath('/portal/inventory');
  revalidatePath('/portal/admin');
  revalidatePath('/portal');
  revalidatePath('/dossier');
  revalidatePath('/projects');
  revalidatePath('/');

  return { success: true, slug: project.slug };
}

/** Removes only explicitly marked QA/demo projects. */
export async function deleteDemoProjectAction(projectId: number): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser || !['super_admin', 'master_broker_admin'].includes(currentUser.role)) {
    return { error: 'No tienes permiso para eliminar proyectos de prueba.' };
  }
  if (!Number.isInteger(projectId) || projectId <= 0) return { error: 'El proyecto indicado no es válido.' };
  const { data: project, error: readError } = await supabase.from('projects').select('id, name, slug, organization_id').eq('id', projectId).maybeSingle();
  if (readError || !project) return { error: 'El proyecto ya no existe o no está disponible.' };
  const isDemo = /^demo\b/i.test(project.name.trim()) || /^demo[-_]/i.test(project.slug.trim());
  if (!isDemo) return { error: 'Solo se pueden eliminar proyectos identificados como DEMO.' };
  const admin = createAdminClient();
  // Commission claims deliberately protect real projects with RESTRICT. A
  // QA/demo project may safely remove its claims first, then its cascaded data.
  const { error: claimsError } = await admin.from('commission_claims').delete().eq('project_id', projectId);
  if (claimsError) return { error: `No fue posible limpiar los registros demo relacionados: ${claimsError.message}` };
  const { error: deleteError } = await admin.from('projects').delete().eq('id', projectId);
  if (deleteError) return { error: `No fue posible eliminar el proyecto demo: ${deleteError.message}` };
  await admin.from('audit_events').insert({ organization_id: project.organization_id, actor_user_id: currentUser.id, action: 'demo_project_deleted', entity_type: 'project', entity_id: String(project.id), metadata: { name: project.name, slug: project.slug } }).then(() => {}, () => {});
  revalidatePath('/portal/admin/projects');
  revalidatePath('/portal/projects');
  return { success: true };
}

/** Removes the complete QA/demo dataset, never real projects or contacts. */
export async function deleteAllDemoDataAction(): Promise<{ success?: boolean; error?: string; removed?: number }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser || currentUser.role !== 'super_admin') return { error: 'Solo el Superadministrador puede limpiar datos DEMO.' };
  const admin = createAdminClient();
  const [{ data: demoProjects }, { data: demoOrgs }, { data: demoContacts }] = await Promise.all([
    admin.from('projects').select('id, organization_id').or('name.ilike.DEMO %,slug.ilike.demo-%'),
    admin.from('organizations').select('id').or('name.ilike.DEMO %,slug.ilike.demo-%'),
    admin.from('contacts').select('id').or('first_name.ilike.DEMO %,last_name.ilike.DEMO %'),
  ]);
  const projectIds = (demoProjects || []).map((row) => Number(row.id)).filter(Number.isInteger);
  const orgIds = (demoOrgs || []).map((row) => Number(row.id)).filter(Number.isInteger);
  const contactIds = (demoContacts || []).map((row) => Number(row.id)).filter(Number.isInteger);
  if (!projectIds.length && !orgIds.length && !contactIds.length) return { success: true, removed: 0 };

  const errors: string[] = [];
  const removeWhereIn = async (table: string, column: string, values: number[]) => {
    if (!values.length) return;
    // The Supabase client cannot infer a table name selected dynamically here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from(table).delete().in(column, values);
    if (error) errors.push(`${table}: ${error.message}`);
  };
  const removeLike = async (table: string, column: string, pattern: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from(table).delete().ilike(column, pattern);
    if (error && !/does not exist|schema cache/i.test(error.message)) errors.push(`${table}: ${error.message}`);
  };

  await removeWhereIn('commission_claims', 'project_id', projectIds);
  await removeLike('commission_claims', 'proforma_number', 'DEMO%');
  await removeLike('commission_claims', 'developer_payment_reference', 'DEMO%');
  await removeLike('project_documents', 'title', 'DEMO%');
  await removeLike('client_documents', 'title', 'DEMO%');
  await removeLike('organization_documents', 'title', 'DEMO%');
  await removeLike('presentations', 'title', 'DEMO%');
  await removeLike('activities', 'subject', 'DEMO%');
  await removeLike('notifications', 'title', 'DEMO%');
  await removeLike('signature_documents', 'title', 'DEMO%');
  await removeLike('agreements', 'commission_terms', 'DEMO%');
  await removeWhereIn('reservation_requests', 'unit_id', projectIds.length ? (await admin.from('units').select('id').in('project_id', projectIds)).data?.map((row) => Number(row.id)).filter(Number.isInteger) || [] : []);
  await removeWhereIn('project_access', 'project_id', projectIds);
  await removeWhereIn('units', 'project_id', projectIds);
  await removeWhereIn('typologies', 'project_id', projectIds);
  await removeWhereIn('projects', 'id', projectIds);
  await removeWhereIn('memberships', 'organization_id', orgIds);
  await removeWhereIn('contacts', 'id', contactIds);
  // Audit history is append-only, so demo organizations cannot be hard-deleted
  // when audit rows still reference them. Archive them instead so they leave
  // every active directory and catalog without breaking the audit ledger.
  if (orgIds.length) {
    const { error } = await admin.from('organizations').update({ status: 'archived' }).in('id', orgIds);
    if (error) errors.push(`organizations: ${error.message}`);
  }
  if (errors.length) return { error: `La limpieza DEMO quedó incompleta: ${errors.join(' · ')}` };
  revalidatePath('/portal/admin');
  revalidatePath('/portal/admin/projects');
  revalidatePath('/portal/projects');
  return { success: true, removed: projectIds.length + orgIds.length + contactIds.length };
}

function colLetterToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

function parseCellRef(ref: string): { col: number; row: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { col: 0, row: 1 };
  return { col: colLetterToIndex(match[1]), row: parseInt(match[2], 10) };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

interface ParsedInventoryItem {
  unitCode: string;
  status: 'available' | 'separated' | 'sold' | 'blocked';
  price: number;
  isPublic: boolean;
  notes: string;
  floorLevel: number;
  bedrooms: number;
  bathrooms: number;
  totalSqm: number;
  section: string;
  tower?: string;
  customColumns: Record<string, string>;
}

function parsePriceValue(val: string): number {
  if (!val) return 0;
  const trimmed = val.trim();
  if (trimmed === '-' || /^(n\/a|tbd|vend|separ|reserv|bloq)/i.test(trimmed)) return 0;
  const cleaned = trimmed.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;
  let num = 0;
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    num = Number(cleaned.replace(/,/g, ''));
  } else if (cleaned.includes('.') && !cleaned.includes(',')) {
    const parts = cleaned.split('.');
    if (parts[parts.length - 1].length === 3) {
      num = Number(parts.join(''));
    } else {
      num = Number(cleaned);
    }
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.indexOf(',') < cleaned.indexOf('.')) {
      num = Number(cleaned.replace(/,/g, ''));
    } else {
      num = Number(cleaned.replace(/\./g, '').replace(',', '.'));
    }
  } else {
    num = Number(cleaned);
  }
  return Number.isFinite(num) && num > 1000 ? num : 0;
}

export async function syncGoogleSheetInventory(
  projectId: number,
  sheetUrl: string
): Promise<{
  success?: boolean;
  count?: number;
  available?: number;
  sold?: number;
  blocked?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);

  if (!currentUser) {
    return { error: 'Debes iniciar sesión para sincronizar inventario.' };
  }

  const orgId = currentUser.organization?.id || 1;

  const { data: inventoryProject, error: inventoryProjectError } = await supabase
    .from('projects')
    .select('currency')
    .eq('id', projectId)
    .maybeSingle();

  if (inventoryProjectError || !inventoryProject) {
    return { error: 'No se pudo determinar la moneda configurada para este proyecto.' };
  }

  const projectCurrency = inventoryProject.currency || 'USD';

  try {
    const cleanedUrl = sheetUrl.trim();
    if (/^https:\/\/brokers\.alterestate\.com\//i.test(cleanedUrl)) {
      return {
        error:
          'Este enlace de AlterEstate es una fuente externa de consulta y no se puede importar como Google Sheets. La sincronización se detuvo para evitar leer el HTML como inventario.',
      };
    }
    const driveMatch = cleanedUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = driveMatch ? driveMatch[1] : null;

    const parsedItems: ParsedInventoryItem[] = [];

    // 1. TRY MULTI-SHEET XLSX EXTRACTION
    if (sheetId) {
      try {
        const xlsxUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
        const xlsxRes = await fetch(xlsxUrl, { cache: 'no-store' });

        if (xlsxRes.ok) {
          const buffer = await xlsxRes.arrayBuffer();
          const zip = await JSZip.loadAsync(buffer);

          // Shared strings
          const sharedStrings: string[] = [];
          const sstXml = await zip.file('xl/sharedStrings.xml')?.async('string');
          if (sstXml) {
            const siMatches = [...sstXml.matchAll(/<si>(.*?)<\/si>/gs)];
            for (const si of siMatches) {
              const tMatches = [...si[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)];
              sharedStrings.push(tMatches.map((m) => m[1]).join(''));
            }
          }

          // Workbook sheets
          const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
          const sheetMatches = [
            ...(workbookXml || '').matchAll(
              /<sheet[^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"[^>]*r:id="([^"]+)"/g
            ),
          ];

          // Relationships
          const relsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
          const relMap: Record<string, string> = {};
          if (relsXml) {
            const relMatches = [
              ...(relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g) || []),
            ];
            for (const r of relMatches) {
              relMap[r[1]] = r[2].startsWith('/') ? r[2].slice(1) : `xl/${r[2]}`;
            }
          }

          const cellRegex = /<c\b([^>]*?)>(?:<v>([^<]*?)<\/v>)?<\/c>/gs;

          for (const s of sheetMatches) {
            const rId = s[3];
            const sheetName = s[1] || '';
            const deliveryTerm = sheetName.match(/\b(\d+)\s*mes(?:es)?\b/i)?.[1];
            const targetFile = relMap[rId] || `xl/worksheets/sheet${s[2]}.xml`;
            const sheetXml = await zip.file(targetFile)?.async('string');
            if (!sheetXml) continue;

            const rowMatches = [...sheetXml.matchAll(/<row r="(\d+)"[^>]*>(.*?)<\/row>/gs)];
            if (rowMatches.length === 0) continue;

            // Extract header columns from row 1
            const headers: string[] = [];
            const headerRow = rowMatches[0];
            for (const m of headerRow[2].matchAll(cellRegex)) {
              const attrs = m[1];
              const val = m[2];
              const rMatch = attrs.match(/r="([A-Z]+\d+)"/);
              const tMatch = attrs.match(/t="([^"]+)"/);
              if (!rMatch) continue;

              const { col } = parseCellRef(rMatch[1]);
              const type = tMatch ? tMatch[1] : '';
              let str = '';
              if (type === 's' && val !== undefined) {
                str = sharedStrings[parseInt(val, 10)] || '';
              } else if (val !== undefined) {
                str = val;
              }
              headers[col] = str.trim();
            }

            const unitColIdx = headers.findIndex(
              (h) =>
                h &&
                (h.toUpperCase().includes('UNIDAD') ||
                  h.toUpperCase().includes('UNIT') ||
                  h.toUpperCase().includes('LOTE') ||
                  h.toUpperCase().includes('VILLA'))
            );
            const statusColIdx = headers.findIndex(
              (h) =>
                h &&
                (h.toUpperCase().includes('ESTADO') ||
                  h.toUpperCase().includes('STATUS') ||
                  h.toUpperCase().includes('ESTATUS') ||
                  h.toUpperCase().includes('DISPONIB'))
            );
            const levelColIdx = headers.findIndex(
              (h) => h && /^(nivel|piso|floor|level|planta)/i.test(h.trim())
            );
            const priceColIdx = headers.findIndex(
              (h) => h && /^(precio|price|valor|costo|list\s*price)/i.test(h.trim())
            );
            const habColIdx = headers.findIndex(
              (h) => h && /^(hab|hab\.|habitaciones|dorm|bedrooms)/i.test(h.trim())
            );
            const banColIdx = headers.findIndex(
              (h) => h && /^(bañ|bañ\.|baños|bath|bathrooms)/i.test(h.trim())
            );
            const halfBanColIdx = headers.findIndex(
              (h) => h && /^(1\/2\s*bañ|medio\s*baño)/i.test(h.trim())
            );
            const sqmColIdx = headers.findIndex(
              (h) =>
                h &&
                /^(m2|m²|metros|area|área|superficie)/i.test(h.trim()) &&
                !/(extra|terreno|patio)/i.test(h.trim())
            );
            const sectionColIdx = headers.findIndex(
              (h) => h && /^(seccion|sección|tipo|model|typology)/i.test(h.trim())
            );
            const towerColIdx = headers.findIndex(
              (h) => h && /^(torre|tower|bloque)/i.test(h.trim())
            );

            // Data rows
            for (let i = 1; i < rowMatches.length; i++) {
              const r = rowMatches[i];
              const cellsMap: Record<number, string> = {};
              for (const m of r[2].matchAll(cellRegex)) {
                const attrs = m[1];
                const val = m[2];
                const rMatch = attrs.match(/r="([A-Z]+\d+)"/);
                const tMatch = attrs.match(/t="([^"]+)"/);
                if (!rMatch) continue;

                const { col } = parseCellRef(rMatch[1]);
                const type = tMatch ? tMatch[1] : '';
                let str = '';
                if (type === 's' && val !== undefined) {
                  str = sharedStrings[parseInt(val, 10)] || '';
                } else if (val !== undefined) {
                  str = val;
                }
                cellsMap[col] = str.trim();
              }

              const unitCode = normalizeUnitCode(unitColIdx >= 0 ? cellsMap[unitColIdx] : cellsMap[0]);
              if (!unitCode || unitCode.length < 2 || !/\d/.test(unitCode) || isGarbageUnitCode(unitCode)) continue;

              const rawStatus = (statusColIdx >= 0 ? cellsMap[statusColIdx] || '' : '').toLowerCase();
              let status: 'available' | 'separated' | 'sold' | 'blocked' = 'available';
              if (rawStatus.includes('vendid') || rawStatus.includes('sold')) {
                status = 'sold';
              } else if (rawStatus.includes('separad') || rawStatus.includes('reserv')) {
                status = 'separated';
              } else if (
                rawStatus.includes('bloque') ||
                rawStatus.includes('modelo') ||
                rawStatus.includes('hold')
              ) {
                status = 'blocked';
              } else {
                status = 'available';
              }

              // Floor level
              let floorLevel = 1;
              if (levelColIdx >= 0 && cellsMap[levelColIdx]) {
                const parsedLvl = parseInt(cellsMap[levelColIdx], 10);
                if (!isNaN(parsedLvl) && parsedLvl > 0) floorLevel = parsedLvl;
              } else {
                const numMatch = unitCode.match(/\d+/);
                if (numMatch) {
                  const n = parseInt(numMatch[0], 10);
                  floorLevel = n >= 100 ? Math.floor(n / 100) : n;
                }
              }

              // Bedrooms
              let bedrooms = 2;
              if (habColIdx >= 0 && cellsMap[habColIdx]) {
                const parsedHab = parseInt(cellsMap[habColIdx], 10);
                if (!isNaN(parsedHab) && parsedHab > 0) bedrooms = parsedHab;
              }

              // Bathrooms
              let bathrooms = 2;
              if (banColIdx >= 0 && cellsMap[banColIdx]) {
                let parsedBan = parseFloat(cellsMap[banColIdx].replace(',', '.'));
                if (
                  halfBanColIdx >= 0 &&
                  cellsMap[halfBanColIdx] &&
                  cellsMap[halfBanColIdx] !== '-' &&
                  parseFloat(cellsMap[halfBanColIdx].replace(',', '.')) > 0
                ) {
                  parsedBan += parseFloat(cellsMap[halfBanColIdx].replace(',', '.')) >= 1 ? 1 : 0.5;
                }
                if (!isNaN(parsedBan) && parsedBan > 0) bathrooms = parsedBan;
              }

              // Total sqm
              let totalSqm = 96;
              if (sqmColIdx >= 0 && cellsMap[sqmColIdx]) {
                const parsedSqm = parseFloat(cellsMap[sqmColIdx].replace(',', '.').replace(/[^\d.]/g, ''));
                if (!isNaN(parsedSqm) && parsedSqm > 0) totalSqm = Math.round(parsedSqm * 100) / 100;
              }

              const section = sectionColIdx >= 0 ? cellsMap[sectionColIdx] || '' : '';
              const tower = towerColIdx >= 0 ? cellsMap[towerColIdx] || undefined : undefined;

              // Price
              let price = 0;
              if (priceColIdx >= 0) {
                price = parsePriceValue(cellsMap[priceColIdx] || '');
              }

              const customColumns: Record<string, string> = {};
              const typologyPrices: number[] = [];
              headers.forEach((h, cIdx) => {
                if (h && cIdx !== unitColIdx && cIdx !== statusColIdx) {
                  const val = cellsMap[cIdx] || '';
                  customColumns[h] = val;
                  if (/^(esmeralda|perla|ámbar|ambar)$/i.test(h.trim())) {
                    const p = parsePriceValue(val);
                    if (p > 1000) typologyPrices.push(p);
                  }
                  if (
                    priceColIdx < 0 &&
                    typologyPrices.length === 0 &&
                    (val.includes('$') || val.includes('USD'))
                  ) {
                    const p = parsePriceValue(val);
                    if (p > 1000) price = p;
                  }
                }
              });

              // Ciprés price columns represent selectable finishes, so use the
              // lowest valid option as the unit's base/list price.
              if (typologyPrices.length > 0) price = Math.min(...typologyPrices);
              if (deliveryTerm) customColumns['Plazo de entrega'] = `${deliveryTerm} meses`;
              if (sheetName) customColumns['Hoja de origen'] = sheetName;

              parsedItems.push({
                unitCode,
                status,
                price,
                isPublic: !rawStatus.includes('modelo'),
                notes: JSON.stringify(customColumns),
                floorLevel,
                bedrooms,
                bathrooms,
                totalSqm,
                section,
                tower,
                customColumns,
              });
            }
          }
        }
      } catch (xlsxErr) {
        console.warn('XLSX parsing failed, falling back to CSV:', xlsxErr);
      }
    }

    // CSV export without a gid silently returns one tab only. Never report a
    // successful multi-tab sync when the workbook could not be read as XLSX.
    if (parsedItems.length === 0) {
      let csvUrl = cleanedUrl;
      if (sheetId) {
        const explicitGid = new URL(cleanedUrl).searchParams.get('gid');
        if (!explicitGid) {
          return {
            error:
              'No se pudo leer el libro completo como Excel. Para importar todas las hojas sin perder unidades, revisa que el Google Sheet permita lectura con el enlace y vuelve a sincronizar.',
          };
        }
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        csvUrl += `&gid=${encodeURIComponent(explicitGid)}`;
      }

      const response = await fetch(csvUrl, { cache: 'no-store' });
      if (!response.ok) {
        return {
          error:
            'No se pudo descargar el archivo desde Google Drive / Google Sheets. Asegúrate de que el enlace tenga permisos de lectura ("Cualquier persona con el enlace").',
        };
      }

      const text = await response.text();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        return { error: 'El archivo descargado está vacío o no contiene filas de unidades.' };
      }

      const originalHeaders = parseCsvLine(lines[0]).map((h) => h.replace(/["\r]/g, '').trim());
      const headers = originalHeaders.map((h) => h.toLowerCase());

      const unitIdx = headers.findIndex(
        (h) =>
          h.includes('unidad') ||
          h.includes('unit') ||
          h.includes('apto') ||
          h.includes('lote') ||
          h.includes('villa')
      );
      const statusIdx = headers.findIndex(
        (h) => h.includes('estado') || h.includes('status') || h.includes('estatus') || h.includes('disponib')
      );
      const levelIdx = headers.findIndex((h) => /^(nivel|piso|floor|level|planta)/i.test(h));
      const priceIdx = headers.findIndex((h) => /^(precio|price|valor|costo|list\s*price)/i.test(h));
      const habIdx = headers.findIndex((h) => /^(hab|hab\.|habitaciones|dorm|bedrooms)/i.test(h));
      const banIdx = headers.findIndex((h) => /^(bañ|bañ\.|baños|bath|bathrooms)/i.test(h));
      const halfBanIdx = headers.findIndex((h) => /^(1\/2\s*bañ|medio\s*baño)/i.test(h));
      const sqmIdx = headers.findIndex(
        (h) => /^(m2|m²|metros|area|área|superficie)/i.test(h) && !/(extra|terreno|patio)/i.test(h)
      );
      const sectionIdx = headers.findIndex((h) => /^(seccion|sección|tipo|model|typology)/i.test(h));
      const towerIdx = headers.findIndex((h) => /^(torre|tower|bloque)/i.test(h));

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]).map((c) => c.replace(/^"|"$/g, '').trim());
        const unitCode = normalizeUnitCode(unitIdx >= 0 ? cols[unitIdx] : cols[0]);
        if (!unitCode || unitCode.length < 2 || !/\d/.test(unitCode) || isGarbageUnitCode(unitCode)) continue;

        const rawStatus = (statusIdx >= 0 ? cols[statusIdx] : '').toLowerCase();
        let status: 'available' | 'separated' | 'sold' | 'blocked' = 'available';
        if (rawStatus.includes('vendid') || rawStatus.includes('sold')) {
          status = 'sold';
        } else if (rawStatus.includes('separad') || rawStatus.includes('reserv')) {
          status = 'separated';
        } else if (
          rawStatus.includes('bloque') ||
          rawStatus.includes('modelo') ||
          rawStatus.includes('hold')
        ) {
          status = 'blocked';
        } else {
          status = 'available';
        }

        // Floor level
        let floorLevel = 1;
        if (levelIdx >= 0 && cols[levelIdx]) {
          const parsedLvl = parseInt(cols[levelIdx], 10);
          if (!isNaN(parsedLvl) && parsedLvl > 0) floorLevel = parsedLvl;
        } else {
          const numMatch = unitCode.match(/\d+/);
          if (numMatch) {
            const n = parseInt(numMatch[0], 10);
            floorLevel = n >= 100 ? Math.floor(n / 100) : n;
          }
        }

        // Bedrooms
        let bedrooms = 2;
        if (habIdx >= 0 && cols[habIdx]) {
          const parsedHab = parseInt(cols[habIdx], 10);
          if (!isNaN(parsedHab) && parsedHab > 0) bedrooms = parsedHab;
        }

        // Bathrooms
        let bathrooms = 2;
        if (banIdx >= 0 && cols[banIdx]) {
          let parsedBan = parseFloat(cols[banIdx].replace(',', '.'));
          if (halfBanIdx >= 0 && cols[halfBanIdx] && cols[halfBanIdx] !== '-' && parseFloat(cols[halfBanIdx].replace(',', '.')) > 0) {
            parsedBan += parseFloat(cols[halfBanIdx].replace(',', '.')) >= 1 ? 1 : 0.5;
          }
          if (!isNaN(parsedBan) && parsedBan > 0) bathrooms = parsedBan;
        }

        // Total sqm
        let totalSqm = 96;
        if (sqmIdx >= 0 && cols[sqmIdx]) {
          const parsedSqm = parseFloat(cols[sqmIdx].replace(',', '.').replace(/[^\d.]/g, ''));
          if (!isNaN(parsedSqm) && parsedSqm > 0) totalSqm = Math.round(parsedSqm * 100) / 100;
        }

        const section = sectionIdx >= 0 ? cols[sectionIdx] || '' : '';
        const tower = towerIdx >= 0 ? cols[towerIdx] || undefined : undefined;

        // Price
        let price = 0;
        if (priceIdx >= 0) {
          price = parsePriceValue(cols[priceIdx] || '');
        }

        const customColumnsMap: Record<string, string> = {};
        for (let cIdx = 0; cIdx < originalHeaders.length; cIdx++) {
          const colName = originalHeaders[cIdx];
          if (cIdx !== unitIdx && cIdx !== statusIdx && colName) {
            const val = cols[cIdx] || '';
            customColumnsMap[colName] = val;
            if (priceIdx < 0 && (val.includes('$') || val.includes('USD'))) {
              const p = parsePriceValue(val);
              if (p > 1000) price = p;
            }
          }
        }

        parsedItems.push({
          unitCode,
          status,
          price,
          isPublic: !rawStatus.includes('modelo'),
          notes: JSON.stringify(customColumnsMap),
          floorLevel,
          bedrooms,
          bathrooms,
          totalSqm,
          section,
          tower,
          customColumns: customColumnsMap,
        });
      }
    }

    if (parsedItems.length === 0) {
      return { error: 'No se encontraron unidades válidas en el archivo de Google Sheets.' };
    }

    // Detect duplicate unit codes across different towers and prefix them to avoid
    // unique-constraint collisions (e.g. Palm View has unit 101 in Torre 1, 2, and 3).
    const codeOccurrences = new Map<string, Set<string>>();
    for (const item of parsedItems) {
      const twr = item.tower || '';
      if (!codeOccurrences.has(item.unitCode)) codeOccurrences.set(item.unitCode, new Set());
      codeOccurrences.get(item.unitCode)!.add(twr);
    }
    const hasTowerCollisions = [...codeOccurrences.values()].some((towers) => towers.size > 1);
    if (hasTowerCollisions) {
      for (const item of parsedItems) {
        if (item.tower) {
          // Extract a short tower tag: "Torre 1" → "T1", "Tower A" → "TA", "Bloque 2" → "B2"
          const towerTag = item.tower
            .replace(/^torre\s*/i, 'T')
            .replace(/^tower\s*/i, 'T')
            .replace(/^bloque\s*/i, 'B')
            .replace(/\s+/g, '');
          item.unitCode = `${towerTag}-${item.unitCode}`;
        }
      }
    }

    // Identify project details
    const { data: projectData } = await supabase
      .from('projects')
      .select('id, name, slug, project_type')
      .eq('id', projectId)
      .maybeSingle();

    const isUveProject =
      projectData?.slug === 'uve-residences' ||
      (typeof projectData?.name === 'string' && /uve\s*residence/i.test(projectData.name));

    // Approved on 2026-09-29 against the official Cipres dossier. Only these
    // obsolete model prices are replaced; other prices and blank cells survive.
    if (projectData?.slug === 'cipres-residences') {
      const approvedPrices: Record<string, { previous: number; current: number }> = {
        ESMERALDA: { previous: 93000, current: 116250 },
        PERLA: { previous: 99000, current: 123750 },
        AMBAR: { previous: 112000, current: 140000 },
      };
      for (const item of parsedItems) {
        let changed = false;
        const modelPrices: number[] = [];
        for (const [column, value] of Object.entries(item.customColumns)) {
          const key = column.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
          const approved = approvedPrices[key];
          if (!approved) continue;
          let price = parsePriceValue(value);
          if (price === approved.previous) {
            price = approved.current;
            item.customColumns[column] = `USD$${price.toLocaleString('en-US')}`;
            changed = true;
          }
          if (price > 1000) modelPrices.push(price);
        }
        if (changed) {
          item.notes = JSON.stringify(item.customColumns);
          if (modelPrices.length) item.price = Math.min(...modelPrices);
        }
      }
    }

    // Ensure appropriate typologies exist
    const { data: existingTypologies } = await supabase
      .from('typologies')
      .select('id, name, bedrooms, bathrooms, total_sqm')
      .eq('project_id', projectId);

    const typologyMap = new Map<string, number>();
    (existingTypologies || []).forEach((t) => {
      typologyMap.set(t.name.toLowerCase().trim(), t.id);
    });

    if (isUveProject) {
      const uveSpecs = [
        { name: 'Apartamento Tipo A', bedrooms: 2, bathrooms: 2, total_sqm: 96 },
        { name: 'Apartamento Tipo B', bedrooms: 2, bathrooms: 2, total_sqm: 115 },
        { name: 'Penthouse Tipo A', bedrooms: 2, bathrooms: 3, total_sqm: 96 },
        { name: 'Penthouse Tipo B', bedrooms: 2, bathrooms: 3, total_sqm: 115 },
      ];
      for (const spec of uveSpecs) {
        if (!typologyMap.has(spec.name.toLowerCase())) {
          const { data: createdTyp } = await supabase
            .from('typologies')
            .insert({
              organization_id: orgId,
              project_id: projectId,
              name: spec.name,
              bedrooms: spec.bedrooms,
              bathrooms: spec.bathrooms,
              total_sqm: spec.total_sqm,
            })
            .select('id')
            .single();
          if (createdTyp) {
            typologyMap.set(spec.name.toLowerCase(), createdTyp.id);
          }
        }
      }
    } else {
      if (typologyMap.size === 0) {
        const { data: newTyp } = await supabase
          .from('typologies')
          .insert({
            organization_id: orgId,
            project_id: projectId,
            name: 'Apartamento',
            bedrooms: 2,
            bathrooms: 2,
            total_sqm: 100,
          })
          .select('id')
          .single();
        if (newTyp) typologyMap.set('apartamento', newTyp.id);
      }
    }

    let totalCreated = 0;
    let availableCount = 0;
    let soldCount = 0;
    let blockedCount = 0;
    let lowestStartingPrice = Infinity;
    const syncedCodes: string[] = [];

    // UPSERT ALL EXTRACTED UNITS
    for (const item of parsedItems) {
      if (item.status === 'available') availableCount++;
      else if (item.status === 'sold') soldCount++;
      else if (item.status === 'blocked') blockedCount++;

      if (item.status === 'available' && item.price > 1000 && item.price < lowestStartingPrice) {
        lowestStartingPrice = item.price;
      }

      let unitTypologyId: number | null = null;
      if (isUveProject) {
        const isTypeB =
          (item.section || '').toUpperCase().includes('TYPE B') || item.totalSqm >= 110;
        const targetName =
          item.floorLevel === 3
            ? isTypeB
              ? 'Penthouse Tipo B'
              : 'Penthouse Tipo A'
            : isTypeB
            ? 'Apartamento Tipo B'
            : 'Apartamento Tipo A';
        unitTypologyId = typologyMap.get(targetName.toLowerCase()) || null;
      }
      if (!unitTypologyId) {
        unitTypologyId = Array.from(typologyMap.values())[0] || null;
      }

      const { error: unitError } = await supabase.from('units').upsert(
        {
          organization_id: orgId,
          project_id: projectId,
          typology_id: unitTypologyId,
          unit_code: item.unitCode,
          tower: item.tower || item.customColumns?.Torre || item.customColumns?.Tower || item.customColumns?.Bloque || null,
          floor_level: item.floorLevel,
          list_price: item.price,
          status: item.status,
          is_public: item.isPublic,
          notes: item.notes,
          currency: projectCurrency,
        },
        { onConflict: 'project_id,unit_code' }
      );

      if (!unitError) {
        totalCreated++;
        syncedCodes.push(item.unitCode);
      } else {
        console.error('syncGoogleSheetInventory: units upsert failed', item.unitCode, unitError);
      }
    }

    if (totalCreated === 0) {
      return { error: 'No se pudieron extraer filas de unidades válidas del archivo.' };
    }

    // Mark missing / legacy units as withdrawn
    const { data: currentProjectUnits } = await supabase
      .from('units')
      .select('id, unit_code')
      .eq('project_id', projectId);

    if (currentProjectUnits) {
      const obsoleteIds = currentProjectUnits
        .filter((u) => !syncedCodes.includes(u.unit_code) || isGarbageUnitCode(u.unit_code))
        .map((u) => u.id);

      if (obsoleteIds.length > 0) {
        await supabase
          .from('units')
          .update({ status: 'withdrawn', is_public: false, updated_at: new Date().toISOString() })
          .in('id', obsoleteIds);
      }
    }

    // Save Google Sheet URL in project_media
    const { data: existingMedia } = await supabase
      .from('project_media')
      .select('id')
      .eq('project_id', projectId)
      .eq('kind', 'google_sheet')
      .maybeSingle();

    if (existingMedia) {
      await supabase
        .from('project_media')
        .update({ storage_path: sheetUrl.trim() })
        .eq('id', existingMedia.id);
    } else {
      await supabase.from('project_media').insert({
        organization_id: orgId,
        project_id: projectId,
        kind: 'google_sheet',
        storage_bucket: 'external',
        storage_path: sheetUrl.trim(),
        alt_text: 'Hoja oficial de disponibilidad Google Sheets',
        sort_order: 99,
      });
    }

    // Update project totals and starting price if lower price found
    const projectUpdates: {
      inventory_total_declared: number;
      inventory_available_declared: number;
      inventory_updated_at: string;
      starting_price?: number;
    } = {
      inventory_total_declared: totalCreated,
      inventory_available_declared: availableCount,
      inventory_updated_at: new Date().toISOString(),
    };
    if (lowestStartingPrice < Infinity && lowestStartingPrice > 0) {
      projectUpdates.starting_price = lowestStartingPrice;
    }

    await supabase.from('projects').update(projectUpdates).eq('id', projectId);

    revalidatePath('/portal/admin/projects');
    revalidatePath('/portal/projects');
    revalidatePath('/portal/inventory');
    revalidatePath('/portal');

    return {
      success: true,
      count: totalCreated,
      available: availableCount,
      sold: soldCount,
      blocked: blockedCount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Error procesando inventario: ${msg}` };
  }
}

export async function syncAlterEstateInventory(projectId: number, projectSlug: string) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) return { error: 'Debes iniciar sesión para sincronizar inventario.' };

  const rawUnits = await fetchAlterEstateUnits(projectSlug);
  const units = rawUnits.map(normalizeAlterEstateUnit).filter((unit) => unit.price > 0);
  if (!units.length) return { error: 'AlterEstate no devolvió unidades válidas para este proyecto.' };

  const orgId = currentUser.organization?.id || 1;
  const { data: project } = await supabase.from('projects').select('currency').eq('id', projectId).maybeSingle();
  if (!project) return { error: 'No se encontró el proyecto.' };

  const typologyIds = new Map<string, number>();
  for (const unit of units) {
    if (!typologyIds.has(unit.typology)) {
      const { data: typology } = await supabase.from('typologies').upsert({
        organization_id: orgId,
        project_id: projectId,
        name: unit.typology,
        bedrooms: unit.bedrooms ?? undefined,
        bathrooms: unit.bathrooms ?? undefined,
        total_sqm: unit.area ?? 0,
      }, { onConflict: 'project_id,name' }).select('id').single();
      if (!typology?.id) return { error: `No se pudo crear la tipología ${unit.typology}.` };
      typologyIds.set(unit.typology, typology.id);
    }
  }

  for (const unit of units) {
    const { error } = await supabase.from('units').upsert({
      organization_id: orgId,
      project_id: projectId,
      typology_id: typologyIds.get(unit.typology),
      unit_code: unit.unitCode,
      floor_level: unit.floor,
      list_price: unit.price,
      status: unit.status,
      is_public: unit.status !== 'blocked',
      notes: unit.notes,
      currency: unit.currency || project.currency || 'USD',
    }, { onConflict: 'project_id,unit_code' });
    if (error) return { error: `No se pudo guardar la unidad ${unit.unitCode}.` };
  }

  await supabase.from('projects').update({
    inventory_total_declared: units.length,
    inventory_available_declared: units.filter((unit) => unit.status === 'available').length,
    inventory_updated_at: new Date().toISOString(),
    starting_price: Math.min(...units.map((unit) => unit.price)),
  }).eq('id', projectId);

  revalidatePath('/portal/admin/projects');
  revalidatePath('/portal/projects');
  return { success: true, count: units.length, available: units.filter((unit) => unit.status === 'available').length };
}

export async function updateUnitAvailabilityAction(
  unitId: number,
  status: 'available' | 'separated' | 'sold' | 'blocked',
  price?: number
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);

  if (!currentUser) {
    return { error: 'Debes iniciar sesión para modificar disponibilidad.' };
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin' && currentUser.role !== 'master_broker_operations') {
    return { error: 'No tienes permisos para cambiar la disponibilidad de unidades.' };
  }

  const updates: {
    status?: 'available' | 'separated' | 'sold' | 'blocked';
    updated_at?: string;
    list_price?: number;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (typeof price === 'number' && !isNaN(price) && price > 0) {
    updates.list_price = price;
  }

  const { data: unit, error: fetchErr } = await supabase
    .from('units')
    .select('id, project_id')
    .eq('id', unitId)
    .single();

  if (fetchErr || !unit) {
    return { error: `No se encontró la unidad: ${fetchErr?.message || 'ID inválido'}` };
  }

  const { error: updateErr } = await supabase
    .from('units')
    .update(updates)
    .eq('id', unitId);

  if (updateErr) {
    return { error: `Error al actualizar unidad: ${updateErr.message}` };
  }

  const { data: allUnits } = await supabase
    .from('units')
    .select('id, status')
    .eq('project_id', unit.project_id);

  if (allUnits) {
    const total = allUnits.length;
    const available = allUnits.filter((u) => u.status === 'available').length;

    await supabase
      .from('projects')
      .update({
        inventory_total_declared: total,
        inventory_available_declared: available,
        inventory_updated_at: new Date().toISOString(),
      })
      .eq('id', unit.project_id);
  }

  revalidatePath('/portal/admin/projects');
  revalidatePath('/portal/projects');
  revalidatePath('/portal/inventory');
  return { success: true };
}

export async function addNewUnitAction(
  projectId: number,
  unitCode: string,
  listPrice: number,
  status: 'available' | 'separated' | 'sold' | 'blocked' = 'available',
  floorLevel: number = 1,
  tower?: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);

  if (!currentUser) {
    return { error: 'Debes iniciar sesión.' };
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    return { error: 'No tienes permisos para añadir unidades.' };
  }

  const cleanCode = unitCode.trim();
  if (!cleanCode) {
    return { error: 'El código de la unidad es obligatorio.' };
  }

  const { data: projectCurrencySource } = await supabase
    .from('projects')
    .select('currency')
    .eq('id', projectId)
    .maybeSingle();
  const projectCurrency = projectCurrencySource?.currency || 'USD';

  let { data: defaultTypology } = await supabase
    .from('typologies')
    .select('id')
    .eq('project_id', projectId)
    .limit(1)
    .maybeSingle();

  if (!defaultTypology) {
    const { data: newTyp, error: typError } = await supabase
      .from('typologies')
      .insert({
        organization_id: currentUser.organization.id,
        project_id: projectId,
        name: 'Unidad Residencial',
        bedrooms: 2,
        bathrooms: 2,
        total_sqm: 85,
      })
      .select('id')
      .single();
    if (typError) return { error: `Error creando tipología: ${typError.message}` };
    defaultTypology = newTyp;
  }

  const { error: insertErr } = await supabase.from('units').insert({
    organization_id: currentUser.organization.id,
    project_id: projectId,
    typology_id: defaultTypology?.id,
    unit_code: cleanCode,
    list_price: listPrice || 185000,
    floor_level: floorLevel || 1,
    tower: tower || null,
    status,
    currency: projectCurrency,
  });

  if (insertErr) {
    return { error: `Error al insertar unidad: ${insertErr.message}` };
  }

  const { data: allUnits } = await supabase
    .from('units')
    .select('id, status')
    .eq('project_id', projectId);

  if (allUnits) {
    await supabase
      .from('projects')
      .update({
        inventory_total_declared: allUnits.length,
        inventory_available_declared: allUnits.filter((u) => u.status === 'available').length,
        inventory_updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);
  }

  revalidatePath('/portal/admin/projects');
  revalidatePath('/portal/projects');
  revalidatePath('/portal/inventory');
  return { success: true };
}

export async function deleteUnitAction(
  unitId: number
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);

  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin')) {
    return { error: 'No tienes permisos para eliminar unidades.' };
  }

  const { data: unit } = await supabase
    .from('units')
    .select('id, project_id')
    .eq('id', unitId)
    .single();

  if (!unit) return { error: 'Unidad no encontrada.' };

  const { error: archiveError } = await supabase
    .from('units')
    .update({ status: 'withdrawn', is_public: false, updated_at: new Date().toISOString() })
    .eq('id', unitId);

  if (archiveError) return { error: archiveError.message };

  const { data: allUnits } = await supabase
    .from('units')
    .select('id, status')
    .eq('project_id', unit.project_id);

  if (allUnits) {
    await supabase
      .from('projects')
      .update({
        inventory_total_declared: allUnits.length,
        inventory_available_declared: allUnits.filter((u) => u.status === 'available').length,
        inventory_updated_at: new Date().toISOString(),
      })
      .eq('id', unit.project_id);
  }

  revalidatePath('/portal/admin/projects');
  revalidatePath('/portal/projects');
  revalidatePath('/portal/inventory');
  return { success: true };
}

export async function toggleUnitVisibilityAction(
  unitId: number,
  isPublic: boolean
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);

  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin')) {
    return { error: 'No tienes permisos para modificar visibilidad.' };
  }

  const { data: unit } = await supabase
    .from('units')
    .select('id, project_id')
    .eq('id', unitId)
    .single();

  if (!unit) return { error: 'Unidad no encontrada.' };

  const { error: updateErr } = await supabase
    .from('units')
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq('id', unitId);

  if (updateErr) return { error: updateErr.message };

  // Recalculate declared inventory for visible units
  const { data: allUnits } = await supabase
    .from('units')
    .select('id, status, is_public')
    .eq('project_id', unit.project_id);

  if (allUnits) {
    const visibleUnits = allUnits.filter((u) => u.is_public !== false);
    const available = visibleUnits.filter((u) => u.status === 'available').length;

    await supabase
      .from('projects')
      .update({
        inventory_total_declared: visibleUnits.length,
        inventory_available_declared: available,
        inventory_updated_at: new Date().toISOString(),
      })
      .eq('id', unit.project_id);
  }

  revalidatePath('/portal/admin/projects');
  revalidatePath('/portal/projects');
  revalidatePath('/portal/inventory');
  return { success: true };
}
