import { stripe as stripePlugin } from '@better-auth/stripe';
import {
  account,
  invitation,
  member,
  organization,
  session,
  subscription,
  user,
  verification,
} from '@starter/db';
import type { Database } from '@starter/db';
import { renderPasswordResetEmail, renderWelcomeEmail } from '@starter/email';
import type { Mailer } from '@starter/email';
import { m, resolveLocale } from '@starter/i18n';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin as adminPlugin, organization as organizationPlugin } from 'better-auth/plugins';
import type Stripe from 'stripe';

export interface CreateAuthOptions {
  db: Database;
  secret: string;
  baseURL: string;
  trustedOrigins: Array<string>;
  mailer?: Mailer | undefined;
  i18nEnabled?: boolean | undefined;
  adminEnabled?: boolean | undefined;
  billingEnabled?: boolean | undefined;
  stripeClient?: Stripe | undefined;
  stripeWebhookSecret?: string | undefined;
  proPriceId?: string | undefined;
}

export function createAuth({
  db,
  secret,
  baseURL,
  trustedOrigins,
  mailer,
  i18nEnabled = true,
  adminEnabled = true,
  billingEnabled = false,
  stripeClient,
  stripeWebhookSecret,
  proPriceId = 'price_pro_monthly',
}: CreateAuthOptions) {
  const plugins = [
    organizationPlugin(),
    ...(adminEnabled ? [adminPlugin()] : []),
    ...(billingEnabled && stripeClient && stripeWebhookSecret
      ? [
          stripePlugin({
            stripeClient,
            stripeWebhookSecret,
            createCustomerOnSignUp: false,
            subscription: {
              enabled: true,
              plans: [
                { name: 'free', priceId: 'price_free' },
                { name: 'pro', priceId: proPriceId },
              ],
            },
          }),
        ]
      : []),
  ];

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
        subscription,
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
    plugins,
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  impersonatedBy: string | null;
}

export async function getSessionUser(
  auth: AuthInstance,
  headers: Headers,
): Promise<SessionUser | null> {
  const result = await auth.api.getSession({ headers });
  if (!result) {
    return null;
  }
  const userRecord: { id: string; role?: unknown } = result.user;
  const sessionRecord: { id: string; impersonatedBy?: unknown } = result.session;
  return {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: userRecord.role === 'admin' ? 'admin' : 'user',
    impersonatedBy:
      typeof sessionRecord.impersonatedBy === 'string' ? sessionRecord.impersonatedBy : null,
  };
}
