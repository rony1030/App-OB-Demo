import { NextResponse, NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const scope = (process.env.NEXT_PUBLIC_APP_SCOPE || 'all').trim().toLowerCase();
  const pathname = request.nextUrl.pathname;

  // Manejo de Scopes de Despliegue modular en Vercel
  if (scope !== 'all') {
    // 1. ÁMBITO DEMO (Para videos tutoriales y pruebas aisladas)
    if (scope === 'demo') {
      if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/inversionista/demo';
        return NextResponse.redirect(url);
      }
      const isAllowedDemo =
        pathname.startsWith('/inversionista/demo') ||
        pathname.startsWith('/inversionista/CLI-') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/portal') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api');

      if (!isAllowedDemo) {
        const url = request.nextUrl.clone();
        url.pathname = '/inversionista/demo';
        return NextResponse.redirect(url);
      }
    } else if (scope === 'portals') {
      // 2. ÁMBITO PORTALS (Portal Inversionista + Portal Desarrollador)
      if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/inversionista';
        return NextResponse.redirect(url);
      }
      const isAllowedPortal =
        pathname.startsWith('/inversionista') ||
        pathname.startsWith('/portal/developer') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/legal');

      if (!isAllowedPortal) {
        const url = request.nextUrl.clone();
        url.pathname = '/inversionista';
        return NextResponse.redirect(url);
      }
    } else if (scope === 'crm') {
      // 3. ÁMBITO CRM (Brokers & Operaciones Comerciales)
      if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
      const isAllowedCrm =
        pathname.startsWith('/portal') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/p/') ||
        pathname.startsWith('/invite') ||
        pathname.startsWith('/solicitar-acceso') ||
        pathname.startsWith('/legal');

      if (!isAllowedCrm) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    } else if (scope === 'public') {
      // 4. ÁMBITO PUBLIC (Web Pública & Landings de Proyectos)
      if (pathname.startsWith('/portal') || pathname.startsWith('/inversionista')) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const isLocalCanaRockPreview =
    process.env.NODE_ENV !== 'production' &&
    process.env.LOCAL_CANA_ROCK_PREVIEW === 'true' &&
    (host === 'localhost' || host === '127.0.0.1') &&
    request.nextUrl.pathname.startsWith('/portal/admin');

  // Local, read-only review mode. Production can never bypass authentication.
  if (isLocalCanaRockPreview) {
    return NextResponse.next({ request });
  }

  // Check if request is from an external custom domain
  const isPlatformHost =
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.includes('vercel.app') ||
    host.includes('ob-brokers');

  // Locale prefix handling: /es, /en, /fr
  const originalPathname = request.nextUrl.pathname;
  const localeMatch = originalPathname.match(/^\/(es|en|fr)(?=\/|$)/i);
  let detectedLocale: string | null = null;
  let targetPathname = originalPathname;

  if (localeMatch) {
    detectedLocale = localeMatch[1].toLowerCase();
    targetPathname = originalPathname.replace(/^\/(es|en|fr)/i, '') || '/';
  }

  // Rewrite external domains if applicable
  if (!isPlatformHost) {
    if (targetPathname === '/') {
      if (host.includes('cipres')) {
        targetPathname = '/proyectos/cipres-residences';
      } else if (host.includes('cana-rock') || host.includes('canarock')) {
        targetPathname = '/desarrolladores/cana-rock';
      }
    }
  }

  // Prepare request for updateSession
  let nextRequest = request;
  if (targetPathname !== originalPathname) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = targetPathname;
    nextRequest = new NextRequest(rewriteUrl, {
      headers: request.headers,
    });
  }

  // Run Supabase session/auth check
  const response = await updateSession(nextRequest);

  // If a locale prefix was present, rewrite so the browser keeps the /en, /fr, /es in address bar,
  // set x-ob-locale header, and persist ob_locale cookie
  if (detectedLocale) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = targetPathname;

    const requestHeaders = new Headers(nextRequest.headers);
    requestHeaders.set('x-ob-locale', detectedLocale);
    requestHeaders.set('x-ob-pathname', originalPathname);

    const rewrittenResponse = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });

    // Copy cookies set during session handling (e.g. Supabase tokens)
    response.cookies.getAll().forEach((cookie) => {
      rewrittenResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    rewrittenResponse.cookies.set('ob_locale', detectedLocale, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });

    rewrittenResponse.headers.set('x-ob-locale', detectedLocale);
    rewrittenResponse.headers.set('x-ob-pathname', originalPathname);

    return rewrittenResponse;
  }

  return response;
}

// Keep export middleware for dual compatibility
export async function middleware(request: NextRequest) {
  return await proxy(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|app-icons/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
