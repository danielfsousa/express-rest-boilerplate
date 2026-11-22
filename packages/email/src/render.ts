import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { LowStockAlertEmail } from './templates/LowStockAlertEmail.ts';
import type { LowStockAlertEmailProps } from './templates/LowStockAlertEmail.ts';
import { OrderReceiptEmail } from './templates/OrderReceiptEmail.ts';
import type { OrderReceiptEmailProps } from './templates/OrderReceiptEmail.ts';
import { PasswordResetEmail } from './templates/PasswordResetEmail.ts';
import type { PasswordResetEmailProps } from './templates/PasswordResetEmail.ts';
import { WelcomeEmail } from './templates/WelcomeEmail.ts';
import type { WelcomeEmailProps } from './templates/WelcomeEmail.ts';

export interface RenderedEmail {
  html: string;
  text: string;
}

export async function renderEmail(element: ReactElement): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}

export function renderWelcomeEmail(props: WelcomeEmailProps): Promise<RenderedEmail> {
  return renderEmail(WelcomeEmail(props));
}

export function renderPasswordResetEmail(props: PasswordResetEmailProps): Promise<RenderedEmail> {
  return renderEmail(PasswordResetEmail(props));
}

export function renderOrderReceiptEmail(props: OrderReceiptEmailProps): Promise<RenderedEmail> {
  return renderEmail(OrderReceiptEmail(props));
}

export function renderLowStockAlertEmail(props: LowStockAlertEmailProps): Promise<RenderedEmail> {
  return renderEmail(LowStockAlertEmail(props));
}
