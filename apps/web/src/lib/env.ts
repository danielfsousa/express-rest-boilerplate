export function getApiBaseUrl(): string {
  const envUrl: unknown = import.meta.env?.['VITE_API_URL'];
  return typeof envUrl === 'string' && envUrl.length > 0 ? envUrl : 'http://127.0.0.1:3001';
}

export function isMultiTenancyEnabled(): boolean {
  const flag: unknown = import.meta.env?.['VITE_FEATURE_MULTI_TENANCY_ENABLED'];
  return flag !== 'false';
}

export function isI18nEnabled(): boolean {
  const flag: unknown = import.meta.env?.['VITE_FEATURE_I18N_ENABLED'];
  return flag !== 'false';
}

export function isBillingEnabled(): boolean {
  const flag: unknown = import.meta.env?.['VITE_FEATURE_BILLING_ENABLED'];
  return flag !== 'false';
}

export function isRealtimeEnabled(): boolean {
  const flag: unknown = import.meta.env?.['VITE_FEATURE_REALTIME_ENABLED'];
  return flag !== 'false';
}
