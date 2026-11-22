export {
  createBirdEmulator,
  createBirdEmulatorFetch,
  type BirdEmulator,
  type CapturedBirdEmail,
} from './emulator.ts';
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
} from './templates/LowStockAlertEmail.ts';
export {
  OrderReceiptEmail,
  type OrderReceiptEmailProps,
  type OrderReceiptItem,
} from './templates/OrderReceiptEmail.ts';
export {
  PasswordResetEmail,
  type PasswordResetEmailProps,
} from './templates/PasswordResetEmail.ts';
export { WelcomeEmail, type WelcomeEmailProps } from './templates/WelcomeEmail.ts';
