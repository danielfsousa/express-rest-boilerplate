import { describe, expect, test } from 'vite-plus/test';
import {
  createBirdEmulator,
  createNoopMailer,
  LowStockAlertEmail,
  OrderReceiptEmail,
  PasswordResetEmail,
  renderEmail,
  renderPasswordResetEmail,
  WelcomeEmail,
} from './index.ts';

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

  test('Bird mailer delivers rendered email to in-process Bird emulator', async () => {
    const emulator = createBirdEmulator();
    const mailer = emulator.createMailer('noreply@bookstore.local');

    const rendered = await renderEmail(WelcomeEmail({ name: 'Carol', locale: 'en' }));
    const sent = await mailer.send({
      to: 'carol@example.com',
      subject: 'Welcome',
      html: rendered.html,
      text: rendered.text,
    });
    expect(sent.messageId.length).toBeGreaterThan(0);

    const messages = emulator.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]?.to).toEqual(['carol@example.com']);
    expect(messages[0]?.html).toContain('Welcome, Carol!');

    const listRes = await emulator.fetch(new Request('http://bird.emulator.local/__messages'));
    expect(listRes.status).toBe(200);

    const notFoundRes = await emulator.fetch(new Request('http://bird.emulator.local/unknown'));
    expect(notFoundRes.status).toBe(404);

    const clearRes = await emulator.fetch(
      new Request('http://bird.emulator.local/__messages', { method: 'DELETE' }),
    );
    expect(clearRes.status).toBe(200);
    expect(emulator.getMessages()).toHaveLength(0);

    const resetRendered = await renderPasswordResetEmail({
      name: 'Carol',
      resetUrl: 'https://example.com/reset',
      locale: 'en',
    });
    expect(resetRendered.html).toContain('https://example.com/reset');

    const noopMailer = createNoopMailer();
    const noopResult = await noopMailer.send({
      to: 'carol@example.com',
      subject: 'Noop',
      html: '<p>noop</p>',
      text: 'noop',
    });
    expect(noopResult.messageId).toBeTruthy();
  });
});
