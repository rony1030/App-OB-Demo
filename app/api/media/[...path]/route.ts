import { NextRequest, NextResponse } from 'next/server';
import { readHostingerAsset, statHostingerAsset } from '@/lib/storage/hostinger-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    path?: string[];
  }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const resolvedParams = await params;
  const segments = resolvedParams?.path;

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return NextResponse.json({ error: 'File path is required.' }, { status: 400 });
  }

  const relativePath = segments.join('/');
  const rangeHeader = request.headers.get('range');
  const result = await readHostingerAsset(relativePath, undefined, rangeHeader);

  if (result.status === 'FORBIDDEN') {
    return NextResponse.json({ error: result.error || 'Forbidden' }, { status: 403 });
  }

  if (result.status === 'INVALID_TYPE') {
    return NextResponse.json({ error: result.error || 'Unsupported Media Type' }, { status: 415 });
  }

  if (result.status === 'RANGE_NOT_SATISFIABLE') {
    return new Response(null, { status: 416, headers: result.headers });
  }

  if (result.status === 'NOT_FOUND' || !result.buffer) {
    return NextResponse.json({ error: result.error || 'Not Found' }, { status: 404 });
  }

  const statusCode = result.status === 'PARTIAL' ? 206 : 200;

  return new Response(new Uint8Array(result.buffer), {
    status: statusCode,
    headers: result.headers,
  });
}

export async function HEAD(_request: NextRequest, { params }: RouteContext) {
  const resolvedParams = await params;
  const segments = resolvedParams?.path;

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return new Response(null, { status: 400 });
  }

  const relativePath = segments.join('/');
  const result = await statHostingerAsset(relativePath);

  if (result.status === 'FORBIDDEN') {
    return new Response(null, { status: 403 });
  }

  if (result.status === 'INVALID_TYPE') {
    return new Response(null, { status: 415 });
  }

  if (result.status === 'NOT_FOUND') {
    return new Response(null, { status: 404 });
  }

  return new Response(null, {
    status: 200,
    headers: result.headers,
  });
}

// Disallow non-read methods explicitly with 405 Method Not Allowed
export async function POST() {
  return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
}

export async function PUT() {
  return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
}

export async function DELETE() {
  return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
}

export async function PATCH() {
  return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
}
