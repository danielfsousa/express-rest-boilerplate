import { describe, expect, test } from 'vite-plus/test';
import { createCloudflareJobQueue } from './cloudflare-queue.ts';
import type {
  CloudflareJobEnvelope,
  CloudflareQueueBinding,
  CloudflareQueueMessage,
  CloudflareQueueMessageBatch,
  CloudflareQueueRetryOptions,
  CloudflareQueueSendOptions,
  CloudflareQueueSendRequest,
} from './cloudflare-queue.ts';
import { JOB_NAMES } from './types.ts';
import type { JobRequest } from './types.ts';

function createMemoryQueueBinding() {
  const sent: Array<{
    body: CloudflareJobEnvelope;
    options: CloudflareQueueSendOptions | undefined;
  }> = [];
  const sentBatches: Array<{
    requests: Array<CloudflareQueueSendRequest<CloudflareJobEnvelope>>;
    options: CloudflareQueueSendOptions | undefined;
  }> = [];

  const binding: CloudflareQueueBinding<CloudflareJobEnvelope> = {
    async send(body, options) {
      sent.push({ body, options });
    },
    async sendBatch(messages, options) {
      sentBatches.push({ requests: [...messages], options });
    },
  };

  return { binding, sent, sentBatches };
}

function createFakeMessage<Body>(params: {
  id: string;
  body: Body;
  attempts?: number | undefined;
}) {
  let acked = false;
  let retried = false;
  let retryOptions: CloudflareQueueRetryOptions | undefined;

  const message: CloudflareQueueMessage<Body> = {
    id: params.id,
    timestamp: new Date(),
    body: params.body,
    attempts: params.attempts ?? 1,
    ack() {
      if (!retried) {
        acked = true;
      }
    },
    retry(options) {
      if (!acked) {
        retried = true;
        retryOptions = options;
      }
    },
  };

  return {
    message,
    getOutcome: () =>
      retryOptions !== undefined ? { acked, retried, retryOptions } : { acked, retried },
  };
}

function createFakeBatch(
  queueName: string,
  messages: ReadonlyArray<CloudflareQueueMessage>,
): CloudflareQueueMessageBatch {
  return {
    queue: queueName,
    messages,
    ackAll() {
      for (const message of messages) {
        message.ack();
      }
    },
    retryAll(options) {
      for (const message of messages) {
        message.retry(options);
      }
    },
  };
}

describe('createCloudflareJobQueue (packages/jobs/cloudflare)', () => {
  test('enqueue sends JSON envelopes with defaultDelaySeconds and returns jobId', async () => {
    const { binding, sent } = createMemoryQueueBinding();
    const queue = createCloudflareJobQueue({
      queue: binding,
      defaultDelaySeconds: 15,
    });

    await queue.start();
    const jobId = await queue.enqueue({
      name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
      payload: { storeId: 'store-1', exportId: 'export-1' },
    });

    expect(typeof jobId).toBe('string');
    expect(jobId.length).toBeGreaterThan(0);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.body.jobId).toBe(jobId);
    expect(sent[0]?.body.job).toEqual({
      name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
      payload: { storeId: 'store-1', exportId: 'export-1' },
    });
    expect(sent[0]?.options).toEqual({
      contentType: 'json',
      delaySeconds: 15,
    });
  });

  test('enqueueBatch chunks more than 100 jobs across sendBatch calls', async () => {
    const { binding, sentBatches } = createMemoryQueueBinding();
    const queue = createCloudflareJobQueue({ queue: binding });

    const jobs: Array<JobRequest> = Array.from({ length: 105 }, (_, index) => ({
      name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
      payload: { storeId: 'store-1', exportId: `export-${String(index)}` },
    }));

    const ids = await queue.enqueueBatch(jobs, { delaySeconds: 5 });

    expect(ids).toHaveLength(105);
    expect(new Set(ids).size).toBe(105);
    expect(sentBatches).toHaveLength(2);
    expect(sentBatches[0]?.requests).toHaveLength(100);
    expect(sentBatches[1]?.requests).toHaveLength(5);
    expect(sentBatches[0]?.options).toEqual({ contentType: 'json', delaySeconds: 5 });
    expect(await queue.enqueueBatch([])).toEqual([]);
  });

  test('dispatches all job types from a MessageBatch and acks on success', async () => {
    const { binding, sent } = createMemoryQueueBinding();
    const queue = createCloudflareJobQueue({ queue: binding });
    const seen: Array<string> = [];

    await queue.registerHandlers({
      [JOB_NAMES.ORDER_RECEIPT]: async (payload) => {
        seen.push(`receipt:${payload.orderId}`);
      },
      [JOB_NAMES.LOW_STOCK_ALERT]: async (payload) => {
        seen.push(`low-stock:${payload.bookId}`);
      },
      [JOB_NAMES.EXPORT_STORE_BOOKS_CSV]: async (payload) => {
        seen.push(`export:${payload.exportId}`);
      },
    });

    await queue.enqueue({
      name: JOB_NAMES.ORDER_RECEIPT,
      payload: {
        storeId: 's1',
        storeName: 'Store One',
        orderId: 'o1',
        customerEmail: 'reader@example.com',
        customerName: 'Reader',
        locale: 'en',
        totalCents: 2500,
        currency: 'USD',
        items: [{ title: 'Domain Modeling', quantity: 1, unitPriceCents: 2500 }],
      },
    });
    await queue.enqueue({
      name: JOB_NAMES.LOW_STOCK_ALERT,
      payload: {
        storeId: 's1',
        storeName: 'Store One',
        ownerEmail: 'owner@example.com',
        bookId: 'b1',
        bookTitle: 'Domain Modeling',
        sku: 'SKU-1',
        stock: 2,
        threshold: 5,
        locale: 'pt-BR',
      },
    });
    await queue.enqueue({
      name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
      payload: { storeId: 's1', exportId: 'e1' },
    });

    const delivered = sent.map((entry, idx) =>
      createFakeMessage({ id: `msg-${String(idx)}`, body: entry.body }),
    );
    const result = await queue.consumeBatch(
      createFakeBatch(
        'bookstore-jobs',
        delivered.map((entry) => entry.message),
      ),
    );

    expect(seen).toEqual(['receipt:o1', 'low-stock:b1', 'export:e1']);
    expect(result).toEqual({
      queue: 'bookstore-jobs',
      total: 3,
      acked: 3,
      retried: 0,
      invalid: 0,
    });
    expect(delivered.every((entry) => entry.getOutcome().acked)).toBe(true);
  });

  test('retries failed messages with exponential backoff while acking healthy ones', async () => {
    const { binding } = createMemoryQueueBinding();
    const queue = createCloudflareJobQueue({
      queue: binding,
      retryDelaySeconds: 30,
      retryBackoff: true,
      maxRetryDelaySeconds: 100,
    });

    await queue.registerHandlers({
      [JOB_NAMES.ORDER_RECEIPT]: async () => {},
      [JOB_NAMES.LOW_STOCK_ALERT]: async () => {},
      [JOB_NAMES.EXPORT_STORE_BOOKS_CSV]: async (payload) => {
        if (payload.exportId.startsWith('fail')) {
          throw new Error(`Export failed for ${payload.exportId}`);
        }
      },
    });

    const okMsg = createFakeMessage({
      id: 'm-ok',
      body: {
        jobId: 'j-ok',
        job: {
          name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
          payload: { storeId: 's1', exportId: 'ok-1' },
        },
      },
    });
    const failAttempt1 = createFakeMessage({
      id: 'm-fail-1',
      attempts: 1,
      body: {
        jobId: 'j-fail-1',
        job: {
          name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
          payload: { storeId: 's1', exportId: 'fail-1' },
        },
      },
    });
    const failAttempt3 = createFakeMessage({
      id: 'm-fail-3',
      attempts: 3,
      body: {
        jobId: 'j-fail-3',
        job: {
          name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
          payload: { storeId: 's1', exportId: 'fail-3' },
        },
      },
    });

    const result = await queue.consumeBatch(
      createFakeBatch('bookstore-jobs', [
        okMsg.message,
        failAttempt1.message,
        failAttempt3.message,
      ]),
    );

    expect(result).toEqual({
      queue: 'bookstore-jobs',
      total: 3,
      acked: 1,
      retried: 2,
      invalid: 0,
    });
    expect(okMsg.getOutcome()).toEqual({ acked: true, retried: false });
    expect(failAttempt1.getOutcome()).toEqual({
      acked: false,
      retried: true,
      retryOptions: { delaySeconds: 30 },
    });
    expect(failAttempt3.getOutcome()).toEqual({
      acked: false,
      retried: true,
      retryOptions: { delaySeconds: 100 },
    });
  });

  test('handles invalid poison messages and throws if consumeBatch runs before registerHandlers', async () => {
    const { binding } = createMemoryQueueBinding();
    const invalidReasons: Array<string> = [];
    const queue = createCloudflareJobQueue({
      queue: binding,
      onInvalidMessage: (_message, reason) => {
        invalidReasons.push(reason);
      },
    });

    const poison = createFakeMessage({ id: 'm-bad', body: { bad: true } });
    await expect(
      queue.consumeBatch(createFakeBatch('bookstore-jobs', [poison.message])),
    ).rejects.toThrow('Cloudflare queue handlers have not been registered');

    await queue.registerHandlers({
      [JOB_NAMES.ORDER_RECEIPT]: async () => {},
      [JOB_NAMES.LOW_STOCK_ALERT]: async () => {},
      [JOB_NAMES.EXPORT_STORE_BOOKS_CSV]: async () => {},
    });

    const valid = createFakeMessage({
      id: 'm-good',
      body: {
        jobId: 'j-good',
        job: {
          name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
          payload: { storeId: 's1', exportId: 'e-good' },
        },
      },
    });

    const result = await queue.consumeBatch(
      createFakeBatch('bookstore-jobs', [poison.message, valid.message]),
    );

    expect(result).toEqual({
      queue: 'bookstore-jobs',
      total: 2,
      acked: 2,
      retried: 0,
      invalid: 1,
    });
    expect(invalidReasons).toHaveLength(1);
    expect(poison.getOutcome()).toEqual({ acked: true, retried: false });
    expect(valid.getOutcome()).toEqual({ acked: true, retried: false });

    await queue.stop();
    await expect(
      queue.consumeBatch(createFakeBatch('bookstore-jobs', [valid.message])),
    ).rejects.toThrow('Cloudflare queue handlers have not been registered');
  });
});
