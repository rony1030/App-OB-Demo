const DEFAULT_PUBLIC_APP_ORIGIN = 'https://brokers.osvaldobello.com';

function normalizeOrigin(value: string | null | undefined, allowHttp: boolean) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const isLoopback = ['localhost', '127.0.0.1', '::1'].includes(url.hostname) || url.hostname.endsWith('.local');
    const allowedProtocol = url.protocol === 'https:' || (allowHttp && url.protocol === 'http:');
    if (isLoopback || !allowedProtocol) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolvePublicAppOrigin(input: {
  configuredOrigin?: string | null;
  requestOrigin?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  environment?: string;
}) {
  const allowHttp = input.environment === 'development';
  const forwardedOrigin = input.forwardedHost
    ? `${input.forwardedProto || (allowHttp ? 'http' : 'https')}://${input.forwardedHost}`
    : null;

  return normalizeOrigin(input.configuredOrigin, allowHttp)
    || normalizeOrigin(input.requestOrigin, allowHttp)
    || (allowHttp ? normalizeOrigin(forwardedOrigin, true) : null)
    || (allowHttp ? 'http://localhost:3000' : DEFAULT_PUBLIC_APP_ORIGIN);
}
