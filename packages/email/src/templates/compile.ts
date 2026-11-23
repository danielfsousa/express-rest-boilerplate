import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { EMAIL_TEMPLATES } from '../template-catalog.ts';
import type { BirdTemplateDefinition, BirdTemplateLanguagePayload } from '../template-catalog.ts';
import {
  renderLowStockAlertEmail,
  renderOrderReceiptEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from './render.ts';

function normalizeLiquidHtml(html: string): string {
  return html.replaceAll('%7B%7B', '{{').replaceAll('%7D%7D', '}}');
}

async function buildWelcomeLanguage(locale: Locale): Promise<BirdTemplateLanguagePayload> {
  const opts = { locale };
  const rendered = await renderWelcomeEmail({ name: '{{ name }}', locale });
  return {
    subject: m.email_welcome_subject({}, opts),
    preview_text: m.email_welcome_body({}, opts),
    html: normalizeLiquidHtml(rendered.html),
    text: rendered.text,
  };
}

async function buildPasswordResetLanguage(locale: Locale): Promise<BirdTemplateLanguagePayload> {
  const opts = { locale };
  const rendered = await renderPasswordResetEmail({
    name: '{{ name }}',
    resetUrl: '{{ reset_url }}',
    locale,
  });
  return {
    subject: m.email_reset_subject({}, opts),
    preview_text: m.email_reset_body({ name: '{{ name }}' }, opts),
    html: normalizeLiquidHtml(rendered.html),
    text: rendered.text,
  };
}

async function buildOrderReceiptLanguage(locale: Locale): Promise<BirdTemplateLanguagePayload> {
  const opts = { locale };
  const rendered = await renderOrderReceiptEmail({
    storeName: '{{ store_name }}',
    orderId: '{{ order_id }}',
    customerName: '{{ customer_name }}',
    totalFormatted: '{{ total_formatted }}',
    items: [],
    locale,
    liquidItemsLoop: true,
  });
  return {
    subject: m.email_receipt_subject({ storeName: '{{ store_name }}' }, opts),
    preview_text: m.email_receipt_body(
      { orderId: '{{ order_id }}', totalFormatted: '{{ total_formatted }}' },
      opts,
    ),
    html: normalizeLiquidHtml(rendered.html),
    text: rendered.text,
  };
}

async function buildLowStockLanguage(locale: Locale): Promise<BirdTemplateLanguagePayload> {
  const opts = { locale };
  const rendered = await renderLowStockAlertEmail({
    storeName: '{{ store_name }}',
    bookTitle: '{{ book_title }}',
    sku: '{{ sku }}',
    stock: '{{ stock }}',
    threshold: '{{ threshold }}',
    locale,
  });
  return {
    subject: m.email_low_stock_subject({ bookTitle: '{{ book_title }}' }, opts),
    preview_text: m.email_low_stock_body(
      {
        bookTitle: '{{ book_title }}',
        sku: '{{ sku }}',
        stock: '{{ stock }}',
        threshold: '{{ threshold }}',
      },
      opts,
    ),
    html: normalizeLiquidHtml(rendered.html),
    text: rendered.text,
  };
}

export async function compileBirdEmailTemplates(): Promise<Array<BirdTemplateDefinition>> {
  const [welcomeEn, welcomePt, resetEn, resetPt, receiptEn, receiptPt, lowStockEn, lowStockPt] =
    await Promise.all([
      buildWelcomeLanguage('en'),
      buildWelcomeLanguage('pt-BR'),
      buildPasswordResetLanguage('en'),
      buildPasswordResetLanguage('pt-BR'),
      buildOrderReceiptLanguage('en'),
      buildOrderReceiptLanguage('pt-BR'),
      buildLowStockLanguage('en'),
      buildLowStockLanguage('pt-BR'),
    ]);

  return [
    {
      slug: EMAIL_TEMPLATES.WELCOME,
      name: 'Bookstore Welcome Email',
      description: 'Sent when a new merchant signs up.',
      category: 'transactional',
      defaultLanguage: 'en',
      languages: {
        en: welcomeEn,
        'pt-BR': welcomePt,
      },
    },
    {
      slug: EMAIL_TEMPLATES.PASSWORD_RESET,
      name: 'Bookstore Password Reset',
      description: 'Sent when a user requests a password reset link.',
      category: 'transactional',
      defaultLanguage: 'en',
      languages: {
        en: resetEn,
        'pt-BR': resetPt,
      },
    },
    {
      slug: EMAIL_TEMPLATES.ORDER_RECEIPT,
      name: 'Bookstore Order Receipt',
      description: 'Sent when a customer order is paid.',
      category: 'transactional',
      defaultLanguage: 'en',
      languages: {
        en: receiptEn,
        'pt-BR': receiptPt,
      },
    },
    {
      slug: EMAIL_TEMPLATES.LOW_STOCK_ALERT,
      name: 'Bookstore Low Stock Alert',
      description: 'Sent to store owners when a book falls below the low stock threshold.',
      category: 'transactional',
      defaultLanguage: 'en',
      languages: {
        en: lowStockEn,
        'pt-BR': lowStockPt,
      },
    },
  ];
}
