import { storeListResponseSchema, storeSchema } from '@starter/contracts';
import { member } from '@starter/db';
import { extractSessionCookie, startTestPostgres } from '@starter/db/test-harness';
import type { TestPostgresHarness } from '@starter/db/test-harness';
import { createLogger } from '@starter/runtime';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';

describe('Auth and Stores integration (apps/api)', () => {
  let pg: TestPostgresHarness;

  beforeAll(async () => {
    pg = await startTestPostgres();
  }, 60_000);

  afterAll(async () => {
    await pg?.stop();
  }, 30_000);

  test('merchant signs up, creates stores, enforces owner-only updates, and rejects staff mutations', async () => {
    const logger = createLogger({ level: 'silent' });
    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
    });
    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
    });

    const signUpOwner = await app.fetch(
      new Request('http://localhost/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice Owner',
          email: 'alice@bookstore.test',
          password: 'Password123!',
        }),
      }),
    );
    expect(signUpOwner.status).toBe(200);
    const ownerCookie = extractSessionCookie(signUpOwner);

    const createRes = await app.fetch(
      new Request('http://localhost/api/v1/stores', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: ownerCookie,
        },
        body: JSON.stringify({
          name: 'Alice Books',
          slug: 'alice-books',
          lowStockThreshold: 7,
        }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = storeSchema.parse(await createRes.json());
    expect(created.slug).toBe('alice-books');
    expect(created.lowStockThreshold).toBe(7);

    const listRes = await app.fetch(
      new Request('http://localhost/api/v1/stores', {
        headers: { cookie: ownerCookie },
      }),
    );
    expect(listRes.status).toBe(200);
    const listed = storeListResponseSchema.parse(await listRes.json());
    expect(listed.stores.map((s) => s.slug)).toContain('alice-books');

    const publicRes = await app.fetch(new Request('http://localhost/api/v1/stores/alice-books'));
    expect(publicRes.status).toBe(200);

    const patchOwner = await app.fetch(
      new Request('http://localhost/api/v1/stores/alice-books', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie: ownerCookie,
        },
        body: JSON.stringify({ name: 'Alice Rare Books' }),
      }),
    );
    expect(patchOwner.status).toBe(200);

    const signUpStaff = await app.fetch(
      new Request('http://localhost/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Bob Staff',
          email: 'bob@bookstore.test',
          password: 'Password123!',
        }),
      }),
    );
    expect(signUpStaff.status).toBe(200);
    const signUpStaffBody: unknown = await signUpStaff.json();
    const staffUserId =
      typeof signUpStaffBody === 'object' &&
      signUpStaffBody !== null &&
      'user' in signUpStaffBody &&
      typeof signUpStaffBody.user === 'object' &&
      signUpStaffBody.user !== null &&
      'id' in signUpStaffBody.user &&
      typeof signUpStaffBody.user.id === 'string'
        ? signUpStaffBody.user.id
        : '';
    expect(staffUserId.length).toBeGreaterThan(0);
    const staffCookie = extractSessionCookie(signUpStaff);

    await pg.drizzleHandle.db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: created.id,
      userId: staffUserId,
      role: 'staff',
    });

    const patchStaff = await app.fetch(
      new Request('http://localhost/api/v1/stores/alice-books', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie: staffCookie,
        },
        body: JSON.stringify({ name: 'Hijacked Name' }),
      }),
    );
    expect(patchStaff.status).toBe(403);
  });

  test('FEATURE_MULTI_TENANCY_ENABLED=false routes to seeded default store and blocks store creation', async () => {
    const logger = createLogger({ level: 'silent' });
    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
    });
    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
      auth,
      multiTenancyEnabled: false,
    });

    const signUp = await app.fetch(
      new Request('http://localhost/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Single Tenant Merchant',
          email: 'single@bookstore.test',
          password: 'Password123!',
        }),
      }),
    );
    expect(signUp.status).toBe(200);
    const cookie = extractSessionCookie(signUp);

    const getAnySlug = await app.fetch(new Request('http://localhost/api/v1/stores/anything-here'));
    expect(getAnySlug.status).toBe(200);
    const defaultStore = storeSchema.parse(await getAnySlug.json());
    expect(defaultStore.slug).toBe('default');

    const createBlocked = await app.fetch(
      new Request('http://localhost/api/v1/stores', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie,
        },
        body: JSON.stringify({
          name: 'Second Store',
          slug: 'second-store',
        }),
      }),
    );
    expect(createBlocked.status).toBe(403);

    const updateDefaultStore = await app.fetch(
      new Request('http://localhost/api/v1/stores/default', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie,
        },
        body: JSON.stringify({ name: 'Single Tenant Bookstore' }),
      }),
    );
    expect(updateDefaultStore.status).toBe(200);
  });
});
