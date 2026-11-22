import { createServer } from '@starter/runtime';
import { describe, expect, test } from 'vite-plus/test';
import {
  createBirdEmulatorFetch,
  createBirdMailer,
  LowStockAlertEmail,
  OrderReceiptEmail,
  PasswordResetEmail,
  renderEmail,
  WelcomeEmail,
} from './index.ts';

function isCapturedResponse(
  value: unknown,
): value is { messages: Array<{ to: Array<string>; subject: string; html: string }> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'messages' in value &&
    Array.isArray(value.messages)
  );
}

describe('packages/email', () => {
  test('renders localized React Email templates in en and pt-BR', async () => {
    const welcomeEn = await renderEmail(WelcomeEmail({ name: 'Alice', locale: 'en' }));
    expect(welcomeEn.html).toContain('Welcome, Alice!');
    expect(welcomeEn.text).toContain('WELCOME, ALICE!');

    const welcomePt = await renderEmail(WelcomeEmail({ name: 'Alice', locale: 'pt-BR' }));
    expect(welcomePt.html).toContain('Olá, Alice!');

    const resetPt = await renderEmail(
      PasswordResetEmail({
        name: 'Alice',
        resetUrl: 'https://example.com/reset',
        locale: 'pt-BR',
      }),
    );
    expect(resetPt.html).toContain('Redefinir senha');

    const receiptEn = await renderEmail(
      OrderReceiptEmail({
        storeName: 'Acme Books',
        orderId: 'ord-1',
        customerName: 'Bob',
        totalFormatted: '$19.99',
        items: [{ title: 'DDIA', quantity: 1, unitPriceFormatted: '$19.99' }],
        locale: 'en',
      }),
    );
    expect(receiptEn.html).toContain('ord-1');
    expect(receiptEn.html).toContain('DDIA');

    const lowStockPt = await renderEmail(
      LowStockAlertEmail({
        storeName: 'Acme Books',
        bookTitle: 'DDIA',
        sku: 'SKU-1',
        stock: 2,
        threshold: 5,
        locale: 'pt-BR',
      }),
    );
    expect(lowStockPt.html).toContain('SKU-1');
  });

  test('Bird mailer delivers rendered email to local Bird HTTP emulator', async () => {
    const server = await createServer({
      port: 0,
      hostname: '127.0.0.1',
      fetch: createBirdEmulatorFetch(),
    });

    try {
      const mailer = createBirdMailer({
        apiBaseUrl: server.url,
        apiKey: 'test-key',
        fromEmail: 'noreply@bookstore.local',
      });

      const rendered = await renderEmail(WelcomeEmail({ name: 'Carol', locale: 'en' }));
      const sent = await mailer.send({
        to: 'carol@example.com',
        subject: 'Welcome',
        html: rendered.html,
        text: rendered.text,
      });
      expect(sent.messageId.length).toBeGreaterThan(0);

      const capturedRes = await fetch(`${server.url}/__messages`);
      expect(capturedRes.status).toBe(200);
      const rawBody: unknown = await capturedRes.json();
      expect(isCapturedResponse(rawBody)).toBe(true);
      if (!isCapturedResponse(rawBody)) {
        return;
      }
      expect(rawBody.messages).toHaveLength(1);
      expect(rawBody.messages[0]?.to).toEqual(['carol@example.com']);
      expect(rawBody.messages[0]?.html).toContain('Welcome, Carol!');
    } finally {
      await server.close();
    }
  });
});
