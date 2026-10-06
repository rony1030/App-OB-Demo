import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() {
  return ['180', '192', '512'].map(size => ({ size }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: value } = await params;
  if (!['180', '192', '512'].includes(value)) return new Response(null, { status: 404 });
  const size = Number(value);
  const logo = await readFile(join(process.cwd(), 'public/brand/logo-isotype-blue.png'));
  // Preserve the original mark and its safe-area padding. Explicit white canvas
  // avoids transparent/black icons on Android's adaptive splash screen.
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#ffffff' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${logo.toString('base64')}`} width={size} height={size} alt="" />
    </div>,
    { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
