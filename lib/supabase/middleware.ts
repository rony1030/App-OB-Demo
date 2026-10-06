import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { getSupabaseConfig } from './config';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabasePublishableKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthenticated = Boolean(user);

    const pathname = request.nextUrl.pathname;
    // Strip locale prefix if present (/es, /en, /fr) to evaluate auth rules
    const normalizedPathname = pathname.replace(/^\/(?:es|en|fr)(?=\/|$)/, '') || '/';
    const isAuthRoute = normalizedPathname.startsWith('/login');
    const isPortalRoute = normalizedPathname.startsWith('/portal');

    if (!isAuthenticated && isPortalRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthenticated && isAuthRoute) {
      const url = request.nextUrl.clone();
      const nextParam = request.nextUrl.searchParams.get('next');
      const targetNext = nextParam && (nextParam.startsWith('/portal') || /^\/(?:es|en|fr)\/portal/.test(nextParam)) ? nextParam : '/portal';
      url.pathname = targetNext;
      url.search = '';
      return NextResponse.redirect(url);
    }
  } catch {
    const pathname = request.nextUrl.pathname;
    const normalizedPathname = pathname.replace(/^\/(?:es|en|fr)(?=\/|$)/, '') || '/';
    if (normalizedPathname.startsWith('/portal')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}
