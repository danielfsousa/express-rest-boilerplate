import type { BirdClient } from '@messagebird/sdk';
import { z } from 'zod';
import { createBirdClient, createBirdMailer } from './mailer.ts';
import type { Mailer } from './mailer.ts';

const liquidPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const liquidItemSchema = z.record(z.string(), liquidPrimitiveSchema);
const liquidParametersSchema = z.record(
  z.string(),
  z.union([liquidPrimitiveSchema, z.array(liquidItemSchema)]),
);

export type BirdTemplateParameters = z.infer<typeof liquidParametersSchema>;

export interface CapturedBirdEmail {
  id: string;
  receivedAt: string;
  to: Array<string>;
  from: string;
  subject: string;
  html: string;
  text: string;
  templateSlug?: string | undefined;
  templateLanguage?: string | undefined;
  templateParameters?: BirdTemplateParameters | undefined;
}

interface StoredLanguageContent {
  subject: string;
  preview_text: string;
  html: string;
  text: string;
}

interface StoredTemplateRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  default_language: string;
  draft_version_id: string;
  published_version_id: string | null;
  revision: number;
  draftLanguages: Map<string, StoredLanguageContent>;
  publishedLanguages: Map<string, StoredLanguageContent>;
  publishedVersionNumber: number;
}

export interface BirdEmulator {
  fetch: typeof fetch;
  createClient: () => BirdClient;
  createMailer: (fromEmail?: string) => Mailer;
  getMessages: () => ReadonlyArray<CapturedBirdEmail>;
  getTemplates: () => ReadonlyArray<{
    id: string;
    slug: string;
    publishedVersionNumber: number;
    languages: Array<string>;
  }>;
  clear: () => void;
}

const addressObjectSchema = z.object({
  email: z.string(),
  name: z.string().optional(),
});

const recipientSchema = z.union([
  z.string(),
  addressObjectSchema,
  z.object({ address: z.object({ email: z.string() }) }),
]);

const birdSendPayloadSchema = z.object({
  from: z.union([z.string(), addressObjectSchema]).optional(),
  sender: z.object({ address: z.object({ email: z.string() }) }).optional(),
  to: z.array(recipientSchema).optional(),
  recipients: z.array(recipientSchema).optional(),
  subject: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  content: z
    .object({
      subject: z.string().optional(),
      html: z.string().optional(),
      text: z.string().optional(),
    })
    .optional(),
  template: z
    .object({
      id: z.string().optional(),
      slug: z.string().optional(),
      language: z.string().optional(),
      parameters: liquidParametersSchema.optional(),
    })
    .optional(),
});

const languageContentSchema = z.object({
  subject: z.string().default(''),
  preview_text: z.string().optional().default(''),
  html: z.string().optional().default(''),
  text: z.string().optional().default(''),
});

const createTemplatePayloadSchema = z.object({
  slug: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional().default(''),
  category: z.string().optional().default('transactional'),
  default_language: z.string().optional().default('en'),
  languages: z.record(z.string(), languageContentSchema).optional(),
});

const submitVersionPayloadSchema = z
  .object({
    validate_only: z.boolean().optional(),
  })
  .optional();

function extractEmailAddress(entry: z.infer<typeof recipientSchema>): string {
  if (typeof entry === 'string') {
    return entry;
  }
  if ('email' in entry) {
    return entry.email;
  }
  return entry.address.email;
}

function extractSenderEmail(data: z.infer<typeof birdSendPayloadSchema>): string {
  if (typeof data.from === 'string') {
    return data.from;
  }
  if (data.from) {
    return data.from.email;
  }
  return data.sender?.address.email ?? '';
}

function renderLiquidString(template: string, parameters: BirdTemplateParameters): string {
  const withLoops = template.replaceAll(
    /\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
    (_match, ...groups: Array<string>) => {
      const itemVar = groups[0] ?? '';
      const listKey = groups[1] ?? '';
      const body = groups[2] ?? '';
      const list = parameters[listKey];
      if (!Array.isArray(list)) {
        return '';
      }
      return list
        .map((item) =>
          body.replaceAll(/\{\{\s*([\w.]+)\s*\}\}/g, (_varMatch, path: string) => {
            const prefix = `${itemVar}.`;
            if (path.startsWith(prefix)) {
              const field = path.slice(prefix.length);
              const val = item[field];
              return val !== undefined && val !== null ? String(val) : '';
            }
            const topVal = parameters[path];
            return topVal !== undefined && topVal !== null && !Array.isArray(topVal)
              ? String(topVal)
              : '';
          }),
        )
        .join('');
    },
  );

  return withLoops.replaceAll(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const value = parameters[key];
    return value !== undefined && value !== null && !Array.isArray(value) ? String(value) : '';
  });
}

function jsonError(status: number, message: string, code = 'error'): Response {
  return Response.json(
    {
      type: status === 404 ? 'not_found_error' : 'validation_error',
      code,
      message,
    },
    { status },
  );
}

function toRequest(input: RequestInfo | URL, init?: RequestInit): Request {
  if (typeof input === 'object' && input !== null && 'url' in input && 'method' in input) {
    return input;
  }
  return new Request(input, init);
}

export function createBirdEmulator(): BirdEmulator {
  const messages: Array<CapturedBirdEmail> = [];
  const templatesBySlug = new Map<string, StoredTemplateRecord>();
  const templatesById = new Map<string, StoredTemplateRecord>();

  function resolveTemplate(ref: string): StoredTemplateRecord | undefined {
    return templatesById.get(ref) ?? templatesBySlug.get(ref);
  }

  function toApiTemplate(record: StoredTemplateRecord) {
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      category: record.category,
      default_language: record.default_language,
      draft_version_id: record.draft_version_id,
      published_version_id: record.published_version_id,
      revision: record.revision,
      languages: [...record.draftLanguages.keys()],
    };
  }

  const emulatorFetch: typeof fetch = Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request = toRequest(input, init);
      const url = new URL(request.url);
      const { pathname } = url;

      if (request.method === 'POST' && pathname === '/v1/email/messages') {
        const parsed = birdSendPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonError(422, 'Invalid email send payload');
        }

        const id = `em_${crypto.randomUUID().slice(0, 12)}`;
        const data = parsed.data;
        const toList = [...(data.to ?? []), ...(data.recipients ?? [])].map(extractEmailAddress);
        const fromEmail = extractSenderEmail(data);

        let subject = data.subject ?? data.content?.subject ?? '';
        let html = data.html ?? data.content?.html ?? '';
        let text = data.text ?? data.content?.text ?? '';
        let templateSlug: string | undefined;
        let templateLanguage: string | undefined;
        let templateParameters: BirdTemplateParameters | undefined;

        if (data.template) {
          const ref = data.template.slug ?? data.template.id ?? '';
          const record = resolveTemplate(ref);
          if (!record || !record.published_version_id) {
            return jsonError(404, `Published template "${ref}" not found`, 'not_found');
          }
          const requestedLang = data.template.language ?? record.default_language;
          const langContent =
            record.publishedLanguages.get(requestedLang) ??
            record.publishedLanguages.get(record.default_language);
          if (!langContent) {
            return jsonError(422, `Template "${record.slug}" has no published content`);
          }

          const params = data.template.parameters ?? {};
          subject = renderLiquidString(langContent.subject, params);
          html = renderLiquidString(langContent.html, params);
          text = renderLiquidString(langContent.text, params);
          templateSlug = record.slug;
          templateLanguage = requestedLang;
          templateParameters = params;
        }

        const captured: CapturedBirdEmail = {
          id,
          receivedAt: new Date().toISOString(),
          to: toList,
          from: fromEmail,
          subject,
          html,
          text,
        };
        if (templateSlug !== undefined) {
          captured.templateSlug = templateSlug;
        }
        if (templateLanguage !== undefined) {
          captured.templateLanguage = templateLanguage;
        }
        if (templateParameters !== undefined) {
          captured.templateParameters = templateParameters;
        }
        messages.push(captured);

        return Response.json({ id, status: 'accepted' }, { status: 202 });
      }

      if (request.method === 'GET' && pathname === '/v1/email/templates') {
        return Response.json(
          { results: [...templatesById.values()].map(toApiTemplate) },
          { status: 200 },
        );
      }

      if (request.method === 'POST' && pathname === '/v1/email/templates') {
        const parsed = createTemplatePayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonError(422, 'Invalid template payload');
        }
        if (templatesBySlug.has(parsed.data.slug)) {
          return jsonError(409, `Template slug "${parsed.data.slug}" already exists`, 'conflict');
        }
        const id = `emt_${crypto.randomUUID().slice(0, 12)}`;
        const draftVersionId = `emv_${crypto.randomUUID().slice(0, 12)}`;
        const draftLanguages = new Map<string, StoredLanguageContent>();
        for (const [lang, content] of Object.entries(parsed.data.languages ?? {})) {
          draftLanguages.set(lang, {
            subject: content.subject,
            preview_text: content.preview_text,
            html: content.html,
            text: content.text,
          });
        }
        const record: StoredTemplateRecord = {
          id,
          slug: parsed.data.slug,
          name: parsed.data.name ?? parsed.data.slug,
          description: parsed.data.description,
          category: parsed.data.category,
          default_language: parsed.data.default_language,
          draft_version_id: draftVersionId,
          published_version_id: null,
          revision: 1,
          draftLanguages,
          publishedLanguages: new Map(),
          publishedVersionNumber: 0,
        };
        templatesById.set(record.id, record);
        templatesBySlug.set(record.slug, record);
        return Response.json(toApiTemplate(record), { status: 201 });
      }

      const templateGetMatch = /^\/v1\/email\/templates\/([^/]+)$/.exec(pathname);
      if (request.method === 'GET' && templateGetMatch?.[1]) {
        const record = resolveTemplate(decodeURIComponent(templateGetMatch[1]));
        if (!record) {
          return jsonError(404, 'Template not found', 'not_found');
        }
        return Response.json(toApiTemplate(record), { status: 200 });
      }

      const langSetMatch =
        /^\/v1\/email\/templates\/([^/]+)\/versions\/([^/]+)\/languages\/([^/]+)$/.exec(pathname);
      if (request.method === 'PUT' && langSetMatch?.[1] && langSetMatch[3]) {
        const record = resolveTemplate(decodeURIComponent(langSetMatch[1]));
        if (!record) {
          return jsonError(404, 'Template not found', 'not_found');
        }
        const parsed = languageContentSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonError(422, 'Invalid language payload');
        }
        const language = decodeURIComponent(langSetMatch[3]);
        record.draftLanguages.set(language, {
          subject: parsed.data.subject,
          preview_text: parsed.data.preview_text,
          html: parsed.data.html,
          text: parsed.data.text,
        });
        record.revision += 1;
        return Response.json({ language, revision: record.revision }, { status: 200 });
      }

      const submitMatch = /^\/v1\/email\/templates\/([^/]+)\/versions\/([^/]+)\/submit$/.exec(
        pathname,
      );
      if (request.method === 'POST' && submitMatch?.[1]) {
        const record = resolveTemplate(decodeURIComponent(submitMatch[1]));
        if (!record) {
          return jsonError(404, 'Template not found', 'not_found');
        }
        const rawText = await request.text();
        const rawJson: unknown = rawText ? JSON.parse(rawText) : {};
        const parsed = submitVersionPayloadSchema.safeParse(rawJson);
        const validateOnly = parsed.success ? (parsed.data?.validate_only ?? false) : false;

        if (
          record.draftLanguages.size === 0 ||
          !record.draftLanguages.has(record.default_language)
        ) {
          return Response.json(
            {
              valid: false,
              errors: [
                {
                  language: record.default_language,
                  field: 'html',
                  message: 'Default language content is required',
                },
              ],
            },
            { status: 200 },
          );
        }

        if (validateOnly) {
          return Response.json({ valid: true, errors: [] }, { status: 200 });
        }

        record.publishedVersionNumber += 1;
        record.published_version_id = `emv_${crypto.randomUUID().slice(0, 12)}`;
        record.publishedLanguages = new Map(record.draftLanguages);
        return Response.json(
          {
            valid: true,
            errors: [],
            version: {
              id: record.published_version_id,
              version_number: record.publishedVersionNumber,
            },
          },
          { status: 200 },
        );
      }

      if (request.method === 'GET' && pathname === '/__messages') {
        return Response.json({ messages }, { status: 200 });
      }

      if (request.method === 'DELETE' && pathname === '/__messages') {
        messages.length = 0;
        return Response.json({ cleared: true }, { status: 200 });
      }

      if (request.method === 'GET' && pathname === '/__templates') {
        return Response.json(
          {
            templates: [...templatesBySlug.values()].map((record) => ({
              id: record.id,
              slug: record.slug,
              publishedVersionNumber: record.publishedVersionNumber,
              languages: [...record.publishedLanguages.keys()],
            })),
          },
          { status: 200 },
        );
      }

      return Response.json({ error: 'Not found' }, { status: 404 });
    },
    { preconnect: () => {} },
  );

  return {
    fetch: emulatorFetch,
    createClient: () =>
      createBirdClient({
        apiKey: 'bird-emulator-key',
        apiBaseUrl: 'http://bird.emulator.local',
        fetchImpl: emulatorFetch,
        maxRetries: 0,
      }),
    createMailer: (fromEmail = 'noreply@bookstore.local') =>
      createBirdMailer({
        apiBaseUrl: 'http://bird.emulator.local',
        apiKey: 'bird-emulator-key',
        fromEmail,
        fetchImpl: emulatorFetch,
        maxRetries: 0,
      }),
    getMessages: () => [...messages],
    getTemplates: () =>
      [...templatesBySlug.values()].map((record) => ({
        id: record.id,
        slug: record.slug,
        publishedVersionNumber: record.publishedVersionNumber,
        languages: [...record.publishedLanguages.keys()],
      })),
    clear: () => {
      messages.length = 0;
    },
  };
}

export function createBirdEmulatorFetch(): typeof fetch {
  return createBirdEmulator().fetch;
}
