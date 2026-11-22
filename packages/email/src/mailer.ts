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
}

export interface CreateBirdMailerOptions {
  apiBaseUrl: string;
  apiKey: string;
  fromEmail: string;
  fetchImpl?: (request: Request) => Promise<Response>;
}

export function createBirdMailer({
  apiBaseUrl,
  apiKey,
  fromEmail,
  fetchImpl = (request) => fetch(request),
}: CreateBirdMailerOptions): Mailer {
  const endpoint = `${apiBaseUrl.replace(/\/+$/, '')}/v1/email/messages`;

  return {
    async send(message) {
      const response = await fetchImpl(
        new Request(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `AccessKey ${apiKey}`,
          },
          body: JSON.stringify({
            recipients: [{ address: { email: message.to } }],
            content: {
              subject: message.subject,
              html: message.html,
              text: message.text,
            },
            sender: {
              address: {
                email: fromEmail,
              },
            },
          }),
        }),
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Bird email API failed (${String(response.status)}): ${body}`);
      }

      const payload: unknown = await response.json();
      const id =
        typeof payload === 'object' &&
        payload !== null &&
        'id' in payload &&
        typeof payload.id === 'string'
          ? payload.id
          : crypto.randomUUID();

      return { messageId: id };
    },
  };
}

export function createNoopMailer(): Mailer {
  return {
    send() {
      return Promise.resolve({ messageId: 'noop' });
    },
  };
}
