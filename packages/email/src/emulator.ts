import { z } from 'zod';
import { createBirdMailer } from './mailer.ts';
import type { Mailer } from './mailer.ts';

export interface CapturedBirdEmail {
  id: string;
  receivedAt: string;
  to: Array<string>;
  from: string;
  subject: string;
  html: string;
  text: string;
}

export interface BirdEmulator {
  fetch: (request: Request) => Promise<Response>;
  createMailer: (fromEmail?: string) => Mailer;
  getMessages: () => ReadonlyArray<CapturedBirdEmail>;
  clear: () => void;
}

const birdSendPayloadSchema = z.object({
  recipients: z
    .array(z.object({ address: z.object({ email: z.string() }) }))
    .optional()
    .default([]),
  sender: z.object({ address: z.object({ email: z.string() }) }).optional(),
  content: z
    .object({
      subject: z.string().optional().default(''),
      html: z.string().optional().default(''),
      text: z.string().optional().default(''),
    })
    .optional(),
});

export function createBirdEmulator(): BirdEmulator {
  const messages: Array<CapturedBirdEmail> = [];

  const emulatorFetch = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/v1/email/messages') {
      const parsed = birdSendPayloadSchema.safeParse(await request.json());
      const id = crypto.randomUUID();
      if (parsed.success) {
        messages.push({
          id,
          receivedAt: new Date().toISOString(),
          to: parsed.data.recipients.map((recipient) => recipient.address.email),
          from: parsed.data.sender?.address.email ?? '',
          subject: parsed.data.content?.subject ?? '',
          html: parsed.data.content?.html ?? '',
          text: parsed.data.content?.text ?? '',
        });
      }
      return Response.json({ id, status: 'accepted' }, { status: 202 });
    }

    if (request.method === 'GET' && url.pathname === '/__messages') {
      return Response.json({ messages }, { status: 200 });
    }

    if (request.method === 'DELETE' && url.pathname === '/__messages') {
      messages.length = 0;
      return Response.json({ cleared: true }, { status: 200 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  };

  return {
    fetch: emulatorFetch,
    createMailer: (fromEmail = 'noreply@bookstore.local') =>
      createBirdMailer({
        apiBaseUrl: 'http://bird.emulator.local',
        apiKey: 'bird-emulator-key',
        fromEmail,
        fetchImpl: emulatorFetch,
      }),
    getMessages: () => [...messages],
    clear: () => {
      messages.length = 0;
    },
  };
}

export function createBirdEmulatorFetch(): (request: Request) => Promise<Response> {
  return createBirdEmulator().fetch;
}
