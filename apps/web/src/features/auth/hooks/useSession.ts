import { authClient } from '../../../lib/auth-client.ts';

export function useSession() {
  return authClient.useSession();
}
