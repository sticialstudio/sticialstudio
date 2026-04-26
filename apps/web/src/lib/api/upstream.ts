import 'server-only';

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function resolveConfiguredApiBaseUrl() {
  const explicitBaseUrl = process.env.API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (publicBaseUrl) {
    return publicBaseUrl;
  }

  return null;
}

export function getUpstreamApiBaseUrl() {
  const configuredBaseUrl = resolveConfiguredApiBaseUrl();
  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000';
  }

  throw new Error(
    'Missing API_BASE_URL. Set API_BASE_URL or NEXT_PUBLIC_API_BASE_URL for the web deployment.',
  );
}

export function buildUpstreamApiUrl(pathWithSearch: string) {
  const baseUrl = getUpstreamApiBaseUrl();
  const normalizedPath = pathWithSearch.startsWith('/') ? pathWithSearch : `/${pathWithSearch}`;
  return `${baseUrl}${normalizedPath}`;
}
