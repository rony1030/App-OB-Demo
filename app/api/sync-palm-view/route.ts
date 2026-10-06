import { NextRequest, NextResponse } from 'next/server';
import { syncGoogleSheetInventory } from '@/app/portal/admin/projects/actions';
import { timingSafeEqual } from 'crypto';

const PALM_VIEW_PROJECT_ID = 33;
const PALM_VIEW_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Ltcj4zlgN8jEM_FBl4IQmkdA32RRn-PlfZ_DIjsXPaI/edit?gid=0#gid=0';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const provided =
    request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!provided) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await syncGoogleSheetInventory(PALM_VIEW_PROJECT_ID, PALM_VIEW_SHEET_URL);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
