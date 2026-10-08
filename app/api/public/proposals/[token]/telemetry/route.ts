import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safePublicProposalMetadata, safePublicSessionId } from '@/lib/analytics/public-proposal-events';
import { getDemoProposalsPersistent } from '@/lib/demo/local-crm-store';

export const dynamic = 'force-dynamic';

const PUBLIC_PROPOSAL_EVENTS = new Set(['pdf_export', 'share_click', 'whatsapp_click', 'locale_change', 'section_view', 'session_ping']);

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const rawBody = await request.text();
    if (rawBody.length > 2_000) {
      return NextResponse.json({ error: 'La solicitud es demasiado extensa.' }, { status: 413 });
    }
    let eventType: string | undefined;
    let metadata: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(rawBody) as { eventType?: unknown; metadata?: unknown };
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
        || (parsed.metadata !== undefined && (!parsed.metadata || typeof parsed.metadata !== 'object' || Array.isArray(parsed.metadata)))) {
        return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
      }
      eventType = typeof parsed.eventType === 'string' ? parsed.eventType : undefined;
      metadata = (parsed.metadata || {}) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
    }
    if (!eventType || !PUBLIC_PROPOSAL_EVENTS.has(eventType)) {
      return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
      const exists = (await getDemoProposalsPersistent()).some((proposal) => proposal.sharedToken === token && proposal.status !== 'archived');
      return exists
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: 'Documento no disponible.' }, { status: 404 });
    }

    if (!/^[a-f0-9]{40}$/i.test(token)) return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: link } = await supabase
      .from('shared_links')
      .select('id, status, expires_at, presentation_version_id')
      .eq('token', token)
      .maybeSingle();
    if (!link || link.status !== 'active' || (link.expires_at && new Date(link.expires_at) < new Date())) {
      return NextResponse.json({ error: 'Enlace no disponible.' }, { status: 404 });
    }

    const { data: version } = await supabase
      .from('presentation_versions')
      .select('snapshot, presentation:presentations(organization_id)')
      .eq('id', link.presentation_version_id)
      .maybeSingle();
    const presentation = version?.presentation as { organization_id?: number } | null;
    const snapshot = version?.snapshot as { items?: Array<{ property_id?: string }>; blocks?: Array<{ title?: string }> } | null;
    const propertyId = snapshot?.items?.[0]?.property_id;
    const projectId = propertyId && /^\d+$/.test(propertyId) ? Number(propertyId) : null;
    if (!presentation?.organization_id) return NextResponse.json({ error: 'Documento no disponible.' }, { status: 404 });

    const userAgent = (request.headers.get('user-agent') || '').slice(0, 512);
    const deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : /mobile|android|iphone/i.test(userAgent) ? 'mobile' : 'desktop';
    const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || undefined;
    const locationCountry = request.headers.get('cf-ipcountry') || undefined;
    const locationCity = request.headers.get('cf-ipcity') || undefined;

    if (eventType === 'session_ping') {
      const sessionId = safePublicSessionId(metadata.sessionId);
      const durationSeconds = typeof metadata.durationSeconds === 'number' && Number.isFinite(metadata.durationSeconds)
        ? Math.max(0, Math.min(86400, Math.round(metadata.durationSeconds)))
        : 0;

      if (!sessionId || durationSeconds <= 0) {
        return NextResponse.json({ ok: true });
      }

      // Check if this session already has a recorded engagement event
      const { data: existingSessionEvent } = await supabase
        .from('engagement_events')
        .select('id, metadata')
        .eq('shared_link_id', link.id)
        .eq('metadata->>sessionId', sessionId)
        .order('occurred_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSessionEvent) {
        const currentMeta = (existingSessionEvent.metadata || {}) as Record<string, unknown>;
        await supabase
          .from('engagement_events')
          .update({
            metadata: {
              ...currentMeta,
              durationSeconds,
            },
          })
          .eq('id', existingSessionEvent.id);
        return NextResponse.json({ ok: true });
      }

      // Check if there is an unassociated recent proposal_view / dossier_view within the last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: recentViewEvent } = await supabase
        .from('engagement_events')
        .select('id, metadata')
        .eq('shared_link_id', link.id)
        .in('event_type', ['proposal_view', 'dossier_view'])
        .gte('occurred_at', fifteenMinutesAgo)
        .order('occurred_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentViewEvent) {
        const currentMeta = (recentViewEvent.metadata || {}) as Record<string, unknown>;
        if (!currentMeta.durationSeconds || !currentMeta.sessionId) {
          await supabase
            .from('engagement_events')
            .update({
              metadata: {
                ...currentMeta,
                sessionId,
                durationSeconds,
              },
            })
            .eq('id', recentViewEvent.id);
          return NextResponse.json({ ok: true });
        }
      }

      await supabase.from('engagement_events').insert({
        organization_id: presentation.organization_id,
        shared_link_id: link.id,
        event_type: 'viewed',
        metadata: {
          sessionId,
          durationSeconds,
          projectId,
          source: 'proposal_viewer',
          deviceType,
          ip: rawIp,
          locationCountry,
          locationCity,
        },
      });
      return NextResponse.json({ ok: true });
    }

    const safeMetadata = safePublicProposalMetadata(eventType, metadata, snapshot?.blocks || []);
    await supabase.from('engagement_events').insert({
      organization_id: presentation.organization_id,
      shared_link_id: link.id,
      event_type: eventType,
      metadata: {
        ...safeMetadata,
        projectId,
        source: 'proposal_viewer',
        deviceType,
        ip: rawIp,
        locationCountry,
        locationCity,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'No fue posible registrar la interacción.' }, { status: 500 });
  }
}
