export function GET() {
  return new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0a1140"/><path d="M16 38c0-11 7-20 16-20s16 9 16 20" fill="none" stroke="#fff" stroke-width="5"/><circle cx="22" cy="38" r="6" fill="none" stroke="#d4af37" stroke-width="4"/><circle cx="42" cy="38" r="6" fill="none" stroke="#d4af37" stroke-width="4"/></svg>',
    { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' } }
  );
}
