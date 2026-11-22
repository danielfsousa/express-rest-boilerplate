import {
  adminOverviewResponseSchema,
  adminStoreSummarySchema,
  adminUserSummarySchema,
  storeListResponseSchema,
} from '@starter/contracts';
import { eq, user } from '@starter/db';
import { extractSessionCookie, startTestPostgres } from '@starter/db/test-harness';
import type { TestPostgresHarness } from '@starter/db/test-harness';
import { createLogger } from '@starter/runtime';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { z } from 'zod';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';

const signUpResponseSchema = z.object({
  user: z.object({
    id: z.string(),
  }),
});

describe('SaaS Platform Admin API & better-auth impersonation (apps/api)', () => {
  let pg: TestPostgresHarness;

  beforeAll(async () => {
    pg = await startTestPostgres();
  }, 60_000);

  afterAll(async () => {
    await pg?.stop();
  }, 30_000);

  test('enforces admin role, aggregates RLS tenant metrics, overrides store plans, bans users, and impersonates merchants', async () => {
    const logger = createLogger({ level: 'silent' });
    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
      adminEnabled: true,
    });

    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
      adminEnabled: true,
    });

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

    await pg.drizzleHandle.db
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

    // 7. Admin cannot ban or demote their own account (400), and can ban/unban a merchant
    const selfBanRes = await app.fetch(
      new Request(`http://localhost/api/v1/admin/users/${adminPayload.user.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ banned: true }),
      }),
    );
    expect(selfBanRes.status).toBe(400);

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
  });
});
