import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!/^[a-f0-9]{40}$/i.test(token)) {
      return NextResponse.json({ error: 'El enlace no es válido.' }, { status: 400 });
    }
    const rawBody = await request.text();
    if (rawBody.length > 4_000) {
      return NextResponse.json({ error: 'La solicitud es demasiado extensa.' }, { status: 413 });
    }
    let body: { decision?: string; clientName?: string; comment?: string };
    try {
      body = JSON.parse(rawBody) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
    }

    if (body.decision !== 'accepted' && body.decision !== 'rejected') {
      return NextResponse.json({ error: 'Selecciona una respuesta válida.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: link } = await supabase
      .from('shared_links')
      .select('id, presentation_version_id')
      .eq('token', token)
      .eq('status', 'active')
      .maybeSingle();
    if (!link) {
      return NextResponse.json({ error: 'Enlace no disponible.' }, { status: 404 });
    }

    const { data: existing } = await (supabase
      .from('proposal_decisions' as never)
      .select('id, decision')
      .eq('shared_link_id', link.id) as unknown as { maybeSingle: () => Promise<{ data: { id: number; decision: string } | null }> })
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ decision: existing.decision, alreadyRecorded: true });
    }

    const { data, error } = await supabase.rpc('submit_proposal_decision', {
      proposal_token: token,
      target_decision: body.decision,
      target_client_name: body.clientName?.trim().slice(0, 160) || undefined,
      target_comment: body.comment?.trim().slice(0, 2000) || undefined,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ decision: body.decision, alreadyRecorded: true });
      }
      console.error('proposal decision rejected', error.code, error.message);
      return NextResponse.json({ error: 'No fue posible registrar la respuesta.' }, { status: 400 });
    }

    return NextResponse.json({ decision: data?.[0]?.decision || body.decision });
  } catch {
    return NextResponse.json({ error: 'No fue posible registrar la respuesta.' }, { status: 500 });
  }
}
