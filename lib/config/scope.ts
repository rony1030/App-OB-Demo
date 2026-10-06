export type AppDeploymentScope = 'all' | 'public' | 'crm' | 'portals' | 'demo';

/**
 * Retorna el alcance (scope) del despliegue actual configurado mediante NEXT_PUBLIC_APP_SCOPE.
 * Valores admitidos:
 * - 'all' (por defecto): ejecuta la aplicación completa (comportamiento unificado).
 * - 'demo': entorno aislado para videos y demostración (/inversionista/demo, catálogo demo de videos).
 * - 'portals': portal del inversionista (/inversionista con OTP) y portal del desarrollador (/portal/developer).
 * - 'crm': portal operativo para brokers y master broker (/portal, /crm, /proposals).
 * - 'public': catálogo general público y landings de proyectos (/, /proyectos, /cana-rock, etc.).
 */
export function getAppScope(): AppDeploymentScope {
  const scope = (process.env.NEXT_PUBLIC_APP_SCOPE || 'all').trim().toLowerCase();
  if (scope === 'demo' || scope === 'portals' || scope === 'crm' || scope === 'public') {
    return scope;
  }
  return 'all';
}

export function isScopeActive(scope: AppDeploymentScope): boolean {
  const current = getAppScope();
  if (current === 'all') return true;
  return current === scope;
}
