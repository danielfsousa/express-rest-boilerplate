import { ENV } from 'varlock/env';

export function getApiBaseUrl(): string {
  return ENV.VITE_API_URL;
}

export function isMultiTenancyEnabled(): boolean {
  return ENV.VITE_FEATURE_MULTI_TENANCY_ENABLED;
}

export function isAdminEnabled(): boolean {
  return ENV.VITE_FEATURE_ADMIN_ENABLED;
}

export function isI18nEnabled(): boolean {
  return ENV.VITE_FEATURE_I18N_ENABLED;
}

export function isBillingEnabled(): boolean {
  return ENV.VITE_FEATURE_BILLING_ENABLED;
}

export function isRealtimeEnabled(): boolean {
  return ENV.VITE_FEATURE_REALTIME_ENABLED;
}
