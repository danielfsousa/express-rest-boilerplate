import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { LowStockAlertEmail } from './LowStockAlertEmail.tsx';
import type { LowStockAlertEmailProps } from './LowStockAlertEmail.tsx';
import { OrderReceiptEmail } from './OrderReceiptEmail.tsx';
import type { OrderReceiptEmailProps } from './OrderReceiptEmail.tsx';
import { PasswordResetEmail } from './PasswordResetEmail.tsx';
import type { PasswordResetEmailProps } from './PasswordResetEmail.tsx';
import { WelcomeEmail } from './WelcomeEmail.tsx';
import type { WelcomeEmailProps } from './WelcomeEmail.tsx';

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
