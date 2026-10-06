import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditMachineTranslations } from '@/lib/i18n/content-translations';
import { timingSafeEqual } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const provided = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!provided) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function run(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await auditMachineTranslations(createAdminClient(), {
      limit: Number(process.env.TRANSLATION_AUDIT_BATCH_SIZE) || 12,
      minimumAgeDays: Number(process.env.TRANSLATION_AUDIT_MIN_AGE_DAYS) || 7,
    });
    return NextResponse.json(result, { status: result.error || result.failed > 0 ? 502 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Translation audit failed.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
