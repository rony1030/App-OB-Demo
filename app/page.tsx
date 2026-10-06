import LandingPage from '@/components/landing/LandingPage';
import { getPublicProjects } from '@/lib/data/projects';
import { getMarketingStats } from '@/lib/data/marketing';
import { getCurrentUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

let cachedLandingData: { data: { projects: Awaited<ReturnType<typeof getPublicProjects>>; stats: Awaited<ReturnType<typeof getMarketingStats>> }; expiresAt: number } | null = null;

async function loadLandingData() {
  const now = Date.now();
  if (cachedLandingData && cachedLandingData.expiresAt > now) {
    return cachedLandingData.data;
  }
  try {
    const [projects, stats] = await Promise.all([getPublicProjects(), getMarketingStats()]);
    cachedLandingData = { data: { projects, stats }, expiresAt: now + 120_000 };
    return { projects, stats };
  } catch (error) {
    if (cachedLandingData) return cachedLandingData.data;
    const localFallbackEnabled =
      process.env.NODE_ENV === 'development' &&
      process.env.LOCAL_SUPABASE_FALLBACK === 'true';

    if (!localFallbackEnabled) throw error;

    console.warn(
      '[local-development] Supabase no está disponible; la portada se renderizará sin catálogo.',
      error,
    );

    return {
      projects: [],
      stats: { masterBrokerCount: 0, projectCount: 0 },
    };
  }
}

export default async function RootHomePage() {
  const [{ projects, stats }, currentUser] = await Promise.all([
    loadLandingData(),
    getCurrentUser().catch(() => null),
  ]);
  const sessionUser = currentUser
    ? { displayName: currentUser.displayName }
    : null;
  return <LandingPage projects={projects} stats={stats} sessionUser={sessionUser} />;
}
