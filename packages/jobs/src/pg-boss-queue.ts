import PgBoss from 'pg-boss';
import { JOB_NAMES } from './types.ts';
import type { JobHandlerMap, JobPayloadMap, JobQueue, JobRequest } from './types.ts';

export interface CreatePgBossJobQueueOptions {
  connectionString: string;
  schema?: string;
  retryLimit?: number;
  retryDelay?: number;
  retryBackoff?: boolean;
  pollingIntervalSeconds?: number;
}

export function createPgBossJobQueue({
  connectionString,
  schema = 'pgboss',
  retryLimit = 3,
  retryDelay = 30,
  retryBackoff = true,
  pollingIntervalSeconds,
}: CreatePgBossJobQueueOptions): JobQueue {
  const boss = new PgBoss({
    connectionString,
    schema,
  });

  const createdQueues = new Set<string>();
  let started = false;

  async function ensureQueue(name: string): Promise<void> {
    if (createdQueues.has(name)) {
      return;
    }
    await boss.createQueue(name, {
      name,
      retryLimit,
      retryDelay,
      retryBackoff,
    });
    createdQueues.add(name);
  }

  return {
    async start() {
      if (started) {
        return;
      }
      await boss.start();
      started = true;
      for (const name of Object.values(JOB_NAMES)) {
        await ensureQueue(name);
      }
    },
    async stop() {
      if (!started) {
        return;
      }
      started = false;
      await boss.stop({ graceful: true });
    },
    async enqueue(job: JobRequest): Promise<string | null> {
      if (!started) {
        await this.start();
      }
      await ensureQueue(job.name);
      return boss.send(job.name, job.payload, {
        retryLimit,
        retryDelay,
        retryBackoff,
      });
    },
    async registerHandlers(handlers: JobHandlerMap): Promise<void> {
      if (!started) {
        await this.start();
      }
      const workOptions =
        typeof pollingIntervalSeconds === 'number' ? { pollingIntervalSeconds } : {};

      await ensureQueue(JOB_NAMES.ORDER_RECEIPT);
      await boss.work<JobPayloadMap[typeof JOB_NAMES.ORDER_RECEIPT]>(
        JOB_NAMES.ORDER_RECEIPT,
        workOptions,
        async (jobs) => {
          for (const job of jobs) {
            await handlers[JOB_NAMES.ORDER_RECEIPT](job.data);
          }
        },
      );

      await ensureQueue(JOB_NAMES.LOW_STOCK_ALERT);
      await boss.work<JobPayloadMap[typeof JOB_NAMES.LOW_STOCK_ALERT]>(
        JOB_NAMES.LOW_STOCK_ALERT,
        workOptions,
        async (jobs) => {
          for (const job of jobs) {
            await handlers[JOB_NAMES.LOW_STOCK_ALERT](job.data);
          }
        },
      );

      await ensureQueue(JOB_NAMES.EXPORT_STORE_BOOKS_CSV);
      await boss.work<JobPayloadMap[typeof JOB_NAMES.EXPORT_STORE_BOOKS_CSV]>(
        JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
        workOptions,
        async (jobs) => {
          for (const job of jobs) {
            await handlers[JOB_NAMES.EXPORT_STORE_BOOKS_CSV](job.data);
          }
        },
      );
    },
  };
}
