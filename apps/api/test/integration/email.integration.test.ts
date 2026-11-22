import { startTestPostgres } from '@starter/db/test-harness';
import type { TestPostgresHarness } from '@starter/db/test-harness';
import { createBirdEmulator } from '@starter/email';
import { createLogger } from '@starter/runtime';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';

describe('better-auth + Bird.com email integration (apps/api)', () => {
  let pg: TestPostgresHarness;

  beforeAll(async () => {
    pg = await startTestPostgres();
  }, 120_000);

  afterAll(async () => {
    await pg?.stop();
  });

  test('merchant signup delivers localized WelcomeEmail to in-process Bird emulator', async () => {
    const logger = createLogger({ level: 'silent' });
    const emulator = createBirdEmulator();
    const mailer = emulator.createMailer('noreply@bookstore.local');

    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'integration-test-secret-32-characters',
      baseURL: 'http://127.0.0.1:3001',
      trustedOrigins: ['http://127.0.0.1:3000'],
      mailer,
      i18nEnabled: true,
    });

    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
    });

    const signUpRes = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept-language': 'pt-BR',
      },
      body: JSON.stringify({
        name: 'Maria Silva',
        email: 'maria@example.com',
        password: 'Password123!',
      }),
    });
    expect(signUpRes.status).toBe(200);

    const messages = emulator.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]?.to).toEqual(['maria@example.com']);
    expect(messages[0]?.subject).toBe('Welcome to Bookstore Platform');
    expect(messages[0]?.html).toContain('Welcome, Maria Silva!');
  });
});
