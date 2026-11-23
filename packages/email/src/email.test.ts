import { describe, expect, test } from 'vite-plus/test';
import {
  createBirdEmulator,
  createNoopMailer,
  EMAIL_TEMPLATES,
  syncBirdTemplates,
} from './index.ts';
import {
  compileBirdEmailTemplates,
  LowStockAlertEmail,
  OrderReceiptEmail,
  PasswordResetEmail,
  renderEmail,
  renderPasswordResetEmail,
  WelcomeEmail,
} from './templates/index.ts';

describe('packages/email', () => {
  test('renders localized React JSX templates in en and pt-BR', async () => {
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

  test('compiles TSX templates, uploads via Bird SDK, and delivers stored template emails', async () => {
    const templates = await compileBirdEmailTemplates();
    expect(templates).toHaveLength(4);

    const resetTemplate = templates.find((t) => t.slug === EMAIL_TEMPLATES.PASSWORD_RESET);
    expect(resetTemplate?.languages.en.html).toContain('href="{{ reset_url }}"');

    const emulator = createBirdEmulator();
    const client = emulator.createClient();

    const createResults = await syncBirdTemplates({ client, templates });
    expect(createResults.every((r) => r.action === 'created')).toBe(true);

    const validateResults = await syncBirdTemplates({
      client,
      templates,
      validateOnly: true,
    });
    expect(validateResults.every((r) => r.action === 'validated')).toBe(true);

    const updateResults = await syncBirdTemplates({ client, templates });
    expect(updateResults.every((r) => r.action === 'updated')).toBe(true);

    const stored = emulator.getTemplates();
    expect(stored).toHaveLength(4);
    expect(stored[0]?.publishedVersionNumber).toBe(2);

    const mailer = emulator.createMailer('noreply@bookstore.local');

    const welcomeSent = await mailer.sendTemplate({
      to: 'carol@example.com',
      slug: EMAIL_TEMPLATES.WELCOME,
      language: 'pt-BR',
      parameters: { name: 'Carol' },
    });
    expect(welcomeSent.messageId.length).toBeGreaterThan(0);

    const receiptSent = await mailer.sendTemplate({
      to: 'bob@example.com',
      slug: EMAIL_TEMPLATES.ORDER_RECEIPT,
      language: 'en',
      parameters: {
        store_name: 'Acme Books',
        order_id: 'ord-42',
        customer_name: 'Bob',
        total_formatted: '29.99 USD',
        items: [{ title: 'DDIA', quantity: 2, unit_price_formatted: '14.99 USD' }],
      },
    });
    expect(receiptSent.messageId.length).toBeGreaterThan(0);

    const messages = emulator.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0]?.templateSlug).toBe(EMAIL_TEMPLATES.WELCOME);
    expect(messages[0]?.templateLanguage).toBe('pt-BR');
    expect(messages[0]?.html).toContain('Olá, Carol!');

    expect(messages[1]?.templateSlug).toBe(EMAIL_TEMPLATES.ORDER_RECEIPT);
    expect(messages[1]?.subject).toBe('Order confirmation from Acme Books');
    expect(messages[1]?.html).toContain('ord-42');
    expect(messages[1]?.html).toContain('DDIA × 2 (14.99 USD)');

    const listRes = await emulator.fetch(new Request('http://bird.emulator.local/__messages'));
    expect(listRes.status).toBe(200);
    const templatesRes = await emulator.fetch(
      new Request('http://bird.emulator.local/__templates'),
    );
    expect(templatesRes.status).toBe(200);

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
    expect(
      (await noopMailer.send({ to: 'a@b.com', subject: 's', html: 'h', text: 't' })).messageId,
    ).toBe('noop');
    expect(
      (
        await noopMailer.sendTemplate({
          to: 'a@b.com',
          slug: EMAIL_TEMPLATES.WELCOME,
          language: 'en',
          parameters: { name: 'Carol' },
        })
      ).messageId,
    ).toBe('noop');
  });
});
