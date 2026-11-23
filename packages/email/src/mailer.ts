import { BirdClient } from '@messagebird/sdk';
import type { BirdClientOptions } from '@messagebird/sdk';
import type { TemplateEmailMessage } from './template-catalog.ts';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  messageId: string;
}

export interface Mailer {
  send(message: EmailMessage): Promise<SendEmailResult>;
  sendTemplate(message: TemplateEmailMessage): Promise<SendEmailResult>;
}

export interface CreateBirdClientOptions {
  apiKey: string;
  apiBaseUrl?: string | undefined;
  fetchImpl?: typeof fetch | undefined;
  maxRetries?: number | undefined;
}

export function createBirdClient({
  apiKey,
  apiBaseUrl,
  fetchImpl,
  maxRetries,
}: CreateBirdClientOptions): BirdClient {
  const options: BirdClientOptions = { apiKey };
  if (apiBaseUrl && apiBaseUrl.trim().length > 0) {
    options.baseUrl = apiBaseUrl.replace(/\/+$/, '');
  }
  if (fetchImpl) {
    options.fetch = fetchImpl;
  }
  if (typeof maxRetries === 'number') {
    options.maxRetries = maxRetries;
  }
  return new BirdClient(options);
}

export interface CreateBirdMailerOptions {
  apiBaseUrl?: string | undefined;
  apiKey: string;
  fromEmail: string;
  fetchImpl?: typeof fetch | undefined;
  maxRetries?: number | undefined;
}

export function createBirdMailer({
  apiBaseUrl,
  apiKey,
  fromEmail,
  fetchImpl,
  maxRetries,
}: CreateBirdMailerOptions): Mailer {
  const client = createBirdClient({
    apiKey,
    apiBaseUrl,
    fetchImpl,
    maxRetries,
  });

  return {
    async send(message) {
      const response = await client.email.send({
        from: fromEmail,
        to: [message.to],
        category: 'transactional',
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return { messageId: response.id };
    },

    async sendTemplate(message) {
      const response = await client.email.send({
        from: fromEmail,
        to: [message.to],
        category: 'transactional',
        template: {
          slug: message.slug,
          language: message.language,
          parameters: { ...message.parameters },
        },
      });
      return { messageId: response.id };
    },
  };
}

export function createNoopMailer(): Mailer {
  return {
    send() {
      return Promise.resolve({ messageId: 'noop' });
    },
    sendTemplate() {
      return Promise.resolve({ messageId: 'noop' });
    },
  };
}
