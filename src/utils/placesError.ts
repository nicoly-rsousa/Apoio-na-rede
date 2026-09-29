export function isPlacesQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: string; message?: string };
  return value.code === 'RESOURCE_EXHAUSTED' || value.code === 'OVER_QUERY_LIMIT'
    || /RESOURCE_EXHAUSTED|OVER_QUERY_LIMIT|quota exceeded/i.test(value.message ?? '');
}
