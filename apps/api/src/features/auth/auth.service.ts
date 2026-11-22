import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from '@starter/db';
import type { Database } from '@starter/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization as organizationPlugin } from 'better-auth/plugins';

export interface CreateAuthOptions {
  db: Database;
  secret: string;
  baseURL: string;
  trustedOrigins: Array<string>;
}

export function createAuth({ db, secret, baseURL, trustedOrigins }: CreateAuthOptions) {
  return betterAuth({
    secret,
    baseURL,
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user,
        session,
        account,
        verification,
        organization,
        member,
        invitation,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [organizationPlugin()],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;

export async function getSessionUser(
  auth: AuthInstance,
  headers: Headers,
): Promise<{ id: string; email: string; name: string } | null> {
  const result = await auth.api.getSession({ headers });
  if (!result) {
    return null;
  }
  return {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
  };
}
