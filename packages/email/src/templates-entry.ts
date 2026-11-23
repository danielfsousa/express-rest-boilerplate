export {
  compileBirdEmailTemplates,
  defineTemplate,
  getRegisteredTemplates,
  renderEmail,
  type CompiledLanguageInput,
  type DefineEmailTemplateInput,
  type EmailTemplateHandle,
  type RegisteredEmailTemplate,
  type RenderedEmail,
} from './define-template.ts';
export {
  LowStockAlertEmail,
  lowStockAlertEmailTemplate,
  type LowStockAlertEmailProps,
} from './templates/LowStockAlertEmail.tsx';
export {
  OrderReceiptEmail,
  orderReceiptEmailTemplate,
  type OrderReceiptEmailProps,
  type OrderReceiptItem,
} from './templates/OrderReceiptEmail.tsx';
export {
  PasswordResetEmail,
  passwordResetEmailTemplate,
  type PasswordResetEmailProps,
} from './templates/PasswordResetEmail.tsx';
export {
  WelcomeEmail,
  welcomeEmailTemplate,
  type WelcomeEmailProps,
} from './templates/WelcomeEmail.tsx';
