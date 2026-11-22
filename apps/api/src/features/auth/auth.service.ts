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
import { renderPasswordResetEmail, renderWelcomeEmail } from '@starter/email';
import type { Mailer } from '@starter/email';
import { m, resolveLocale } from '@starter/i18n';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization as organizationPlugin } from 'better-auth/plugins';

export interface CreateAuthOptions {
  db: Database;
  secret: string;
  baseURL: string;
  trustedOrigins: Array<string>;
  mailer?: Mailer | undefined;
  i18nEnabled?: boolean | undefined;
}

export function createAuth({
  db,
  secret,
  baseURL,
  trustedOrigins,
  mailer,
  i18nEnabled = true,
}: CreateAuthOptions) {
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
      async sendResetPassword({ user: targetUser, url }) {
        if (!mailer) {
          return;
        }
        const locale = resolveLocale(undefined, i18nEnabled);
        const rendered = await renderPasswordResetEmail({
          name: targetUser.name,
          resetUrl: url,
          locale,
        });
        await mailer.send({
          to: targetUser.email,
          subject: m.email_reset_subject({}, { locale }),
          html: rendered.html,
          text: rendered.text,
        });
      },
    },
    databaseHooks: {
      user: {
        create: {
          async after(createdUser) {
            if (!mailer) {
              return;
            }
            const locale = resolveLocale(undefined, i18nEnabled);
            const rendered = await renderWelcomeEmail({ name: createdUser.name, locale });
            await mailer.send({
              to: createdUser.email,
              subject: m.email_welcome_subject({}, { locale }),
              html: rendered.html,
              text: rendered.text,
            });
          },
        },
      },
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
