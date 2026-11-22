import path from 'node:path';
import { createDb, migrateDb, sql } from '@starter/db';
import { createBirdEmulatorFetch, createBirdMailer } from '@starter/email';
import { createDbClient, createLogger, createServer } from '@starter/runtime';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { z } from 'zod';
import { createApp } from '../../src/app.ts';

const capturedMessagesSchema = z.object({
  messages: z.array(
    z.object({
      to: z.array(z.string()),
      subject: z.string(),
      html: z.string(),
    }),
  ),
});
import { createAuth } from '../../src/features/auth/auth.service.ts';

const migrationsFolder = path.resolve(import.meta.dirname, '../../../../packages/db/drizzle');

describe('better-auth + Bird.com email integration (apps/api)', () => {
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

  test('merchant signup delivers localized WelcomeEmail to Bird HTTP emulator', async () => {
    const birdServer = await createServer({
      port: 0,
      hostname: '127.0.0.1',
      fetch: createBirdEmulatorFetch(),
    });
    const db = createDbClient({ url: appUri });
    const drizzleHandle = createDb(appUri);
    const logger = createLogger({ level: 'silent' });
    const mailer = createBirdMailer({
      apiBaseUrl: birdServer.url,
      apiKey: 'test-bird-key',
      fromEmail: 'noreply@bookstore.local',
    });
    const auth = createAuth({
      db: drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
      mailer,
      i18nEnabled: true,
    });
    const app = createApp({
      db,
      logger,
      drizzleDb: drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
    });

    try {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Elena Merchant',
            email: 'elena@email-test.dev',
            password: 'Password123!',
          }),
        }),
      );
      expect(res.status).toBe(200);

      const capturedRes = await fetch(`${birdServer.url}/__messages`);
      expect(capturedRes.status).toBe(200);
      const captured = capturedMessagesSchema.parse(await capturedRes.json());
      expect(captured.messages).toHaveLength(1);
      expect(captured.messages[0]?.to).toEqual(['elena@email-test.dev']);
      expect(captured.messages[0]?.html).toContain('Welcome, Elena Merchant!');
    } finally {
      await drizzleHandle.close();
      await db.close();
      await birdServer.close();
    }
  });
});
