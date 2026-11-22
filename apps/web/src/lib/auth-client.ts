import { adminClient, organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { getApiBaseUrl } from './env.ts';

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  fetchOptions: {
    credentials: 'include',
    customFetchImpl: (input, init) => globalThis.fetch(input, init),
  },
  plugins: [organizationClient(), adminClient()],
});
