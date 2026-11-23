import type { Locale } from '@starter/i18n';

export const EMAIL_TEMPLATES = {
  WELCOME: 'bookstore_welcome',
  PASSWORD_RESET: 'bookstore_password_reset',
  ORDER_RECEIPT: 'bookstore_order_receipt',
  LOW_STOCK_ALERT: 'bookstore_low_stock_alert',
} as const;

export type EmailTemplateSlug = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

export interface WelcomeTemplateParameters {
  name: string;
}

export interface PasswordResetTemplateParameters {
  name: string;
  reset_url: string;
}

export interface OrderReceiptTemplateItem {
  title: string;
  quantity: number;
  unit_price_formatted: string;
}

export interface OrderReceiptTemplateParameters {
  store_name: string;
  order_id: string;
  customer_name: string;
  total_formatted: string;
  items: Array<OrderReceiptTemplateItem>;
}

export interface LowStockAlertTemplateParameters {
  store_name: string;
  book_title: string;
  sku: string;
  stock: number;
  threshold: number;
}

export type TemplateEmailMessage =
  | {
      to: string;
      slug: typeof EMAIL_TEMPLATES.WELCOME;
      language: Locale;
      parameters: WelcomeTemplateParameters;
    }
  | {
      to: string;
      slug: typeof EMAIL_TEMPLATES.PASSWORD_RESET;
      language: Locale;
      parameters: PasswordResetTemplateParameters;
    }
  | {
      to: string;
      slug: typeof EMAIL_TEMPLATES.ORDER_RECEIPT;
      language: Locale;
      parameters: OrderReceiptTemplateParameters;
    }
  | {
      to: string;
      slug: typeof EMAIL_TEMPLATES.LOW_STOCK_ALERT;
      language: Locale;
      parameters: LowStockAlertTemplateParameters;
    };

export interface BirdTemplateLanguagePayload {
  subject: string;
  preview_text: string;
  html: string;
  text: string;
}

export interface BirdTemplateDefinition {
  slug: EmailTemplateSlug;
  name: string;
  description: string;
  category: 'transactional';
  defaultLanguage: Locale;
  languages: {
    en: BirdTemplateLanguagePayload;
    'pt-BR': BirdTemplateLanguagePayload;
  };
}
