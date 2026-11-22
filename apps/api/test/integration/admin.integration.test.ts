import path from 'node:path';
import {
  adminOverviewResponseSchema,
  adminStoreSummarySchema,
  adminUserSummarySchema,
  storeListResponseSchema,
} from '@starter/contracts';
import { createDb, eq, migrateDb, sql, user } from '@starter/db';
import { createDbClient, createLogger } from '@starter/runtime';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { z } from 'zod';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';

const migrationsFolder = path.resolve(import.meta.dirname, '../../../../packages/db/drizzle');

const signUpResponseSchema = z.object({
  user: z.object({
    id: z.string(),
  }),
});

function extractSessionCookie(response: Response): string {
  const cookieJar = new Map<string, string>();
  for (const header of response.headers.getSetCookie()) {
    const firstPair = header.split(';')[0]?.trim();
    if (!firstPair) {
      continue;
    }
    const eqIndex = firstPair.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }
    const name = firstPair.slice(0, eqIndex).trim();
    const value = firstPair.slice(eqIndex + 1).trim();
    if (value.length > 0) {
      cookieJar.set(name, `${name}=${value}`);
    }
  }
  if (cookieJar.size === 0) {
    throw new Error('Expected set-cookie header from auth response');
  }
  return [...cookieJar.values()].join('; ');
}

describe('SaaS Platform Admin API & better-auth impersonation (apps/api)', () => {
  let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;
  let appUri: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17-alpine').start();
    const adminUri = container.getConnectionUri();

    const adminHandle = createDb(adminUri, 1);
    try {
      await adminHandle.db.execute(
        sql.raw(`
          CREATE ROLE app_user LOGIN PASSWORD 'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
          GRANT CONNECT ON DATABASE ${container.getDatabase()} TO app_user;
          GRANT USAGE ON SCHEMA public TO app_user;
        `),
      );
    } finally {
      await adminHandle.close();
    }

    await migrateDb(adminUri, migrationsFolder);

    const parsed = new URL(adminUri);
    parsed.username = 'app_user';
    parsed.password = 'app_password';
    appUri = parsed.toString();
  }, 60_000);

  afterAll(async () => {
    await container?.stop();
  }, 30_000);

  test('enforces admin role, aggregates RLS tenant metrics, overrides store plans, bans users, and impersonates merchants', async () => {
    const db = createDbClient({ url: appUri });
    const drizzleHandle = createDb(appUri);
    const logger = createLogger({ level: 'silent' });
    const auth = createAuth({
      db: drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
      adminEnabled: true,
    });

    const app = createApp({
      db,
      logger,
      drizzleDb: drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
      adminEnabled: true,
    });

    try {
      // 1. Sign up a regular merchant and create a store + published book
      const merchantSignUp = await app.fetch(
        new Request('http://localhost/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Tenant Merchant',
            email: 'merchant@tenant.test',
            password: 'Password123!',
          }),
        }),
      );
      expect(merchantSignUp.status).toBe(200);
      const merchantCookie = extractSessionCookie(merchantSignUp);
      const merchantPayload = signUpResponseSchema.parse(await merchantSignUp.json());
      const merchantUserId = merchantPayload.user.id;

      await app.fetch(
        new Request('http://localhost/api/v1/stores', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: merchantCookie },
          body: JSON.stringify({ name: 'Tenant Bookstore', slug: 'tenant-books' }),
        }),
      );

      await app.fetch(
        new Request('http://localhost/api/v1/stores/tenant-books/books', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: merchantCookie },
          body: JSON.stringify({
            sku: 'TENANT-1',
            title: 'SaaS Architecture',
            author: 'D. Sousa',
            priceCents: 3200,
            stock: 10,
            published: true,
          }),
        }),
      );

      // 2. Non-admin merchant is rejected with 403 on /api/v1/admin/overview
      const forbiddenRes = await app.fetch(
        new Request('http://localhost/api/v1/admin/overview', {
          headers: { cookie: merchantCookie },
        }),
      );
      expect(forbiddenRes.status).toBe(403);

      // 3. Sign up platform admin and promote to role='admin'
      const adminSignUp = await app.fetch(
        new Request('http://localhost/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Platform Admin',
            email: 'admin@platform.test',
            password: 'Password123!',
          }),
        }),
      );
      expect(adminSignUp.status).toBe(200);
      const adminCookie = extractSessionCookie(adminSignUp);
      const adminPayload = signUpResponseSchema.parse(await adminSignUp.json());

      await drizzleHandle.db
        .update(user)
        .set({ role: 'admin' })
        .where(eq(user.id, adminPayload.user.id));

      // 4. Admin fetches cross-tenant overview (RLS metrics computed per store context)
      const overviewRes = await app.fetch(
        new Request('http://localhost/api/v1/admin/overview', {
          headers: { cookie: adminCookie },
        }),
      );
      expect(overviewRes.status).toBe(200);
      const overview = adminOverviewResponseSchema.parse(await overviewRes.json());
      expect(overview.totalStores).toBe(1);
      expect(overview.totalUsers).toBe(2);
      const tenantSummary = overview.stores.find((s) => s.slug === 'tenant-books');
      expect(tenantSummary?.publishedBookCount).toBe(1);
      expect(tenantSummary?.plan).toBe('free');

      // 5. Admin overrides tenant-books plan to Pro
      const grantProRes = await app.fetch(
        new Request('http://localhost/api/v1/admin/stores/tenant-books/plan', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: adminCookie },
          body: JSON.stringify({ plan: 'pro', status: 'active' }),
        }),
      );
      expect(grantProRes.status).toBe(200);
      const updatedStore = adminStoreSummarySchema.parse(await grantProRes.json());
      expect(updatedStore.plan).toBe('pro');

      // 6. Admin impersonates the merchant via better-auth admin plugin
      const impersonateRes = await app.fetch(
        new Request('http://localhost/api/auth/admin/impersonate-user', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: adminCookie },
          body: JSON.stringify({ userId: merchantUserId }),
        }),
      );
      expect(impersonateRes.status).toBe(200);
      const impersonatedCookie = extractSessionCookie(impersonateRes);

      // Using the impersonated session cookie, the admin sees the merchant's stores
      const impersonatedStoresRes = await app.fetch(
        new Request('http://localhost/api/v1/stores', {
          headers: { cookie: impersonatedCookie },
        }),
      );
      expect(impersonatedStoresRes.status).toBe(200);
      const impersonatedStores = storeListResponseSchema.parse(await impersonatedStoresRes.json());
      expect(impersonatedStores.stores.map((s) => s.slug)).toContain('tenant-books');

      // 7. Admin bans and unbans a user
      const banRes = await app.fetch(
        new Request(`http://localhost/api/v1/admin/users/${merchantUserId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: adminCookie },
          body: JSON.stringify({ banned: true, banReason: 'Terms violation' }),
        }),
      );
      expect(banRes.status).toBe(200);
      const bannedUser = adminUserSummarySchema.parse(await banRes.json());
      expect(bannedUser.banned).toBe(true);
      expect(bannedUser.banReason).toBe('Terms violation');

      const unbanRes = await app.fetch(
        new Request(`http://localhost/api/v1/admin/users/${merchantUserId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: adminCookie },
          body: JSON.stringify({ banned: false }),
        }),
      );
      expect(unbanRes.status).toBe(200);
      expect(adminUserSummarySchema.parse(await unbanRes.json()).banned).toBe(false);
    } finally {
      await drizzleHandle.close();
      await db.close();
    }
  });
});
