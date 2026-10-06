'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPublicAssetUrl, PUBLIC_ASSETS_BUCKET } from '@/lib/supabase/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    if (!projectId || isNaN(projectId)) {
      return NextResponse.json({ error: 'ID de proyecto inválido' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('organization:organizations(id)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    const userOrgId = (membership?.organization as unknown as { id: number } | null)?.id;

    const { data: project } = await supabase
      .from('projects')
      .select('id, slug, name, organization_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    if (!userOrgId || userOrgId !== (project as unknown as { organization_id: number }).organization_id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { data: packMedia } = await supabase
      .from('project_media')
      .select('storage_path, storage_bucket, alt_text, sort_order')
      .eq('project_id', projectId)
      .eq('kind', 'image_pack')
      .order('sort_order', { ascending: true });

    const media = packMedia && packMedia.length > 0
      ? packMedia
      : (await supabase
          .from('project_media')
          .select('storage_path, storage_bucket, alt_text, sort_order')
          .eq('project_id', projectId)
          .in('kind', ['hero', 'gallery'])
          .order('sort_order', { ascending: true })).data || [];

    const { data: watermarkMedia } = await supabase
      .from('project_media')
      .select('storage_path, storage_bucket')
      .eq('project_id', projectId)
      .eq('kind', 'watermark_logo')
      .limit(1)
      .maybeSingle();

    const imageUrls: string[] = [];
    for (const item of media) {
      if (item.storage_path && (item.storage_bucket || PUBLIC_ASSETS_BUCKET) === PUBLIC_ASSETS_BUCKET) {
        imageUrls.push(getPublicAssetUrl(item.storage_path));
      } else if (item.storage_path?.startsWith('http') || item.storage_path?.startsWith('data:') || item.storage_path?.startsWith('/')) {
        imageUrls.push(item.storage_path);
      } else if (item.storage_path) {
        const { data: { publicUrl } } = supabase.storage
          .from(item.storage_bucket || 'public-assets')
          .getPublicUrl(item.storage_path);
        imageUrls.push(publicUrl);
      }
    }

    let watermarkUrl: string | null = '/brand/ob-brokers-horizontal-blanco.png';
    if (watermarkMedia && (watermarkMedia.storage_bucket || PUBLIC_ASSETS_BUCKET) === PUBLIC_ASSETS_BUCKET) {
      watermarkUrl = getPublicAssetUrl(watermarkMedia.storage_path);
    } else if (watermarkMedia) {
      const { data: { publicUrl } } = supabase.storage
        .from(watermarkMedia.storage_bucket || 'public-assets')
        .getPublicUrl(watermarkMedia.storage_path);
      watermarkUrl = publicUrl;
    }

    return NextResponse.json({
      project: { id: project.id, slug: project.slug, name: project.name },
      images: imageUrls,
      watermarkUrl,
    });
  } catch (err: unknown) {
    console.error('Image pack download error:', err);
    return NextResponse.json(
      { error: 'Error al obtener paquete de imágenes.' },
      { status: 500 }
    );
  }
}
