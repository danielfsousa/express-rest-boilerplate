export { createBirdEmulatorFetch, type CapturedBirdEmail } from './emulator.ts';
export {
  createBirdMailer,
  createNoopMailer,
  type CreateBirdMailerOptions,
  type EmailMessage,
  type Mailer,
  type SendEmailResult,
} from './mailer.ts';
export {
  renderEmail,
  renderLowStockAlertEmail,
  renderOrderReceiptEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
  type RenderedEmail,
} from './render.ts';
export {
  LowStockAlertEmail,
  type LowStockAlertEmailProps,
} from './templates/LowStockAlertEmail.tsx';
export {
  OrderReceiptEmail,
  type OrderReceiptEmailProps,
  type OrderReceiptItem,
} from './templates/OrderReceiptEmail.tsx';
export {
  PasswordResetEmail,
  type PasswordResetEmailProps,
} from './templates/PasswordResetEmail.tsx';
export { WelcomeEmail, type WelcomeEmailProps } from './templates/WelcomeEmail.tsx';
