export {
  createBirdEmulator,
  createBirdEmulatorFetch,
  type BirdEmulator,
  type CapturedBirdEmail,
} from './emulator.ts';
export {
  createBirdClient,
  createBirdMailer,
  createNoopMailer,
  type CreateBirdClientOptions,
  type CreateBirdMailerOptions,
  type EmailMessage,
  type Mailer,
  type SendEmailResult,
} from './mailer.ts';
export {
  syncBirdTemplates,
  type SyncBirdTemplatesOptions,
  type SyncedBirdTemplateResult,
} from './sync-templates.ts';
export {
  EMAIL_TEMPLATES,
  type BirdTemplateDefinition,
  type BirdTemplateLanguagePayload,
  type EmailTemplateSlug,
  type LowStockAlertTemplateParameters,
  type OrderReceiptTemplateItem,
  type OrderReceiptTemplateParameters,
  type PasswordResetTemplateParameters,
  type TemplateEmailMessage,
  type WelcomeTemplateParameters,
} from './template-catalog.ts';
