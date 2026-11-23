import type { RuntimeLogger } from '@starter/runtime/types';
import { z } from 'zod';
import { JOB_NAMES } from './types.ts';
import type { JobHandlerMap, JobQueue, JobRequest } from './types.ts';

const CLOUDFLARE_MAX_BATCH_SIZE = 100;
const CLOUDFLARE_MAX_DELAY_SECONDS = 86_400;

export type CloudflareQueueContentType = 'json' | 'text' | 'bytes' | 'v8';

export interface CloudflareQueueSendOptions {
  contentType?: CloudflareQueueContentType | undefined;
  delaySeconds?: number | undefined;
}

export interface CloudflareQueueRetryOptions {
  delaySeconds?: number | undefined;
}

export interface CloudflareQueueSendRequest<Body = unknown> {
  body: Body;
  contentType?: CloudflareQueueContentType | undefined;
  delaySeconds?: number | undefined;
}

export interface CloudflareQueueBinding<Body = unknown> {
  send(message: Body, options?: CloudflareQueueSendOptions): Promise<void>;
  sendBatch(
    messages: Iterable<CloudflareQueueSendRequest<Body>>,
    options?: CloudflareQueueSendOptions,
  ): Promise<void>;
}

export interface CloudflareQueueMessage<Body = unknown> {
  readonly id: string;
  readonly timestamp: Date;
  readonly body: Body;
  readonly attempts: number;
  ack(): void;
  retry(options?: CloudflareQueueRetryOptions): void;
}

export interface CloudflareQueueMessageBatch<Body = unknown> {
  readonly queue: string;
  readonly messages: ReadonlyArray<CloudflareQueueMessage<Body>>;
  ackAll(): void;
  retryAll(options?: CloudflareQueueRetryOptions): void;
}

export interface CloudflareJobEnvelope {
  jobId: string;
  job: JobRequest;
}

const localeSchema = z.enum(['en', 'pt-BR']);

const orderReceiptPayloadSchema = z.object({
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  orderId: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  locale: localeSchema,
  totalCents: z.number().int().nonnegative(),
  currency: z.string().min(1),
  items: z.array(
    z.object({
      title: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPriceCents: z.number().int().nonnegative(),
    }),
  ),
});

const lowStockAlertPayloadSchema = z.object({
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  ownerEmail: z.string().email(),
  bookId: z.string().min(1),
  bookTitle: z.string().min(1),
  sku: z.string().min(1),
  stock: z.number().int().nonnegative(),
  threshold: z.number().int().nonnegative(),
  locale: localeSchema,
});

const exportStoreBooksCsvPayloadSchema = z.object({
  storeId: z.string().min(1),
  exportId: z.string().min(1),
});

const jobRequestSchema = z.discriminatedUnion('name', [
  z.object({
    name: z.literal(JOB_NAMES.ORDER_RECEIPT),
    payload: orderReceiptPayloadSchema,
  }),
  z.object({
    name: z.literal(JOB_NAMES.LOW_STOCK_ALERT),
    payload: lowStockAlertPayloadSchema,
  }),
  z.object({
    name: z.literal(JOB_NAMES.EXPORT_STORE_BOOKS_CSV),
    payload: exportStoreBooksCsvPayloadSchema,
  }),
]);

export const cloudflareJobEnvelopeSchema = z.object({
  jobId: z.string().min(1),
  job: jobRequestSchema,
});

export type ParseCloudflareJobEnvelopeResult =
  | { ok: true; envelope: CloudflareJobEnvelope }
  | { ok: false; error: string };

export function parseCloudflareJobEnvelope(body: unknown): ParseCloudflareJobEnvelopeResult {
  const parsed = cloudflareJobEnvelopeSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; ') || 'Invalid job envelope',
    };
  }
  return {
    ok: true,
    envelope: parsed.data,
  };
}

export interface CreateCloudflareQueueConsumerOptions {
  handlers: JobHandlerMap;
  logger?: RuntimeLogger | undefined;
  retryDelaySeconds?: number | undefined;
  retryBackoff?: boolean | undefined;
  maxRetryDelaySeconds?: number | undefined;
  retryInvalidMessages?: boolean | undefined;
  onInvalidMessage?:
    | ((message: CloudflareQueueMessage, reason: string) => void | Promise<void>)
    | undefined;
}

export interface CloudflareBatchResult {
  queue: string;
  total: number;
  acked: number;
  retried: number;
  invalid: number;
}

async function dispatchJob(handlers: JobHandlerMap, job: JobRequest): Promise<void> {
  switch (job.name) {
    case JOB_NAMES.ORDER_RECEIPT:
      await handlers[JOB_NAMES.ORDER_RECEIPT](job.payload);
      return;
    case JOB_NAMES.LOW_STOCK_ALERT:
      await handlers[JOB_NAMES.LOW_STOCK_ALERT](job.payload);
      return;
    case JOB_NAMES.EXPORT_STORE_BOOKS_CSV:
      await handlers[JOB_NAMES.EXPORT_STORE_BOOKS_CSV](job.payload);
      return;
  }
}

function computeRetryDelaySeconds(params: {
  attempts: number;
  baseDelaySeconds: number;
  retryBackoff: boolean;
  maxDelaySeconds: number;
}): number {
  const cappedMax = Math.min(
    CLOUDFLARE_MAX_DELAY_SECONDS,
    Math.max(0, Math.floor(params.maxDelaySeconds)),
  );
  const base = Math.max(0, Math.floor(params.baseDelaySeconds));
  if (!params.retryBackoff) {
    return Math.min(cappedMax, base);
  }
  const exponent = Math.max(0, params.attempts - 1);
  return Math.min(cappedMax, Math.round(base * 2 ** exponent));
}

export function createCloudflareQueueConsumer({
  handlers,
  logger,
  retryDelaySeconds = 30,
  retryBackoff = true,
  maxRetryDelaySeconds = 3600,
  retryInvalidMessages = false,
  onInvalidMessage,
}: CreateCloudflareQueueConsumerOptions): (
  batch: CloudflareQueueMessageBatch,
) => Promise<CloudflareBatchResult> {
  return async (batch) => {
    let acked = 0;
    let retried = 0;
    let invalid = 0;

    for (const message of batch.messages) {
      const parsed = parseCloudflareJobEnvelope(message.body);
      if (!parsed.ok) {
        invalid += 1;
        logger?.error(
          {
            queue: batch.queue,
            messageId: message.id,
            attempts: message.attempts,
            reason: parsed.error,
          },
          'Received invalid Cloudflare Queue job envelope',
        );
        if (onInvalidMessage) {
          await onInvalidMessage(message, parsed.error);
        }
        if (retryInvalidMessages) {
          message.retry();
          retried += 1;
        } else {
          message.ack();
          acked += 1;
        }
        continue;
      }

      try {
        await dispatchJob(handlers, parsed.envelope.job);
        message.ack();
        acked += 1;
      } catch (error) {
        const delaySeconds = computeRetryDelaySeconds({
          attempts: message.attempts,
          baseDelaySeconds: retryDelaySeconds,
          retryBackoff,
          maxDelaySeconds: maxRetryDelaySeconds,
        });
        logger?.error(
          {
            queue: batch.queue,
            messageId: message.id,
            jobId: parsed.envelope.jobId,
            jobName: parsed.envelope.job.name,
            attempts: message.attempts,
            delaySeconds,
            errorMessage:
              typeof error === 'object' &&
              error !== null &&
              'message' in error &&
              typeof error.message === 'string'
                ? error.message
                : String(error),
          },
          'Cloudflare Queue job failed; scheduling retry',
        );
        if (delaySeconds > 0) {
          message.retry({ delaySeconds });
        } else {
          message.retry();
        }
        retried += 1;
      }
    }

    return {
      queue: batch.queue,
      total: batch.messages.length,
      acked,
      retried,
      invalid,
    };
  };
}

export interface CreateCloudflareJobQueueOptions {
  queue: CloudflareQueueBinding<CloudflareJobEnvelope>;
  defaultDelaySeconds?: number | undefined;
  logger?: RuntimeLogger | undefined;
  retryDelaySeconds?: number | undefined;
  retryBackoff?: boolean | undefined;
  maxRetryDelaySeconds?: number | undefined;
  retryInvalidMessages?: boolean | undefined;
  onInvalidMessage?:
    | ((message: CloudflareQueueMessage, reason: string) => void | Promise<void>)
    | undefined;
}

export interface CloudflareJobQueue extends JobQueue {
  enqueue(job: JobRequest): Promise<string>;
  enqueueBatch(
    jobs: ReadonlyArray<JobRequest>,
    options?: CloudflareQueueSendOptions,
  ): Promise<Array<string>>;
  consumeBatch(batch: CloudflareQueueMessageBatch): Promise<CloudflareBatchResult>;
}

function buildSendOptions(
  options: CloudflareQueueSendOptions | undefined,
  defaultDelaySeconds: number | undefined,
): CloudflareQueueSendOptions {
  const sendOptions: CloudflareQueueSendOptions = {
    contentType: options?.contentType ?? 'json',
  };
  const delay = options?.delaySeconds ?? defaultDelaySeconds;
  if (typeof delay === 'number' && delay > 0) {
    sendOptions.delaySeconds = Math.min(CLOUDFLARE_MAX_DELAY_SECONDS, Math.floor(delay));
  }
  return sendOptions;
}

export function createCloudflareJobQueue({
  queue,
  defaultDelaySeconds,
  logger,
  retryDelaySeconds,
  retryBackoff,
  maxRetryDelaySeconds,
  retryInvalidMessages,
  onInvalidMessage,
}: CreateCloudflareJobQueueOptions): CloudflareJobQueue {
  let consumer:
    | ((batch: CloudflareQueueMessageBatch) => Promise<CloudflareBatchResult>)
    | undefined;

  return {
    async start() {
      // Cloudflare Queues bindings are managed by the Workers runtime.
    },
    async stop() {
      consumer = undefined;
    },
    async enqueue(job: JobRequest): Promise<string> {
      const jobId = crypto.randomUUID();
      await queue.send({ jobId, job }, buildSendOptions(undefined, defaultDelaySeconds));
      return jobId;
    },
    async enqueueBatch(
      jobs: ReadonlyArray<JobRequest>,
      options?: CloudflareQueueSendOptions,
    ): Promise<Array<string>> {
      if (jobs.length === 0) {
        return [];
      }
      const sendOptions = buildSendOptions(options, defaultDelaySeconds);
      const jobIds: Array<string> = [];

      for (let index = 0; index < jobs.length; index += CLOUDFLARE_MAX_BATCH_SIZE) {
        const chunk = jobs.slice(index, index + CLOUDFLARE_MAX_BATCH_SIZE);
        const requests: Array<CloudflareQueueSendRequest<CloudflareJobEnvelope>> = chunk.map(
          (job) => {
            const jobId = crypto.randomUUID();
            jobIds.push(jobId);
            return {
              body: { jobId, job },
              contentType: sendOptions.contentType,
            };
          },
        );
        await queue.sendBatch(requests, sendOptions);
      }

      return jobIds;
    },
    async registerHandlers(handlers: JobHandlerMap): Promise<void> {
      consumer = createCloudflareQueueConsumer({
        handlers,
        logger,
        retryDelaySeconds,
        retryBackoff,
        maxRetryDelaySeconds,
        retryInvalidMessages,
        onInvalidMessage,
      });
    },
    async consumeBatch(batch: CloudflareQueueMessageBatch): Promise<CloudflareBatchResult> {
      if (!consumer) {
        throw new Error('Cloudflare queue handlers have not been registered');
      }
      return await consumer(batch);
    },
  };
}
