import { JOB_NAMES } from './types.ts';
import type { JobHandlerMap, JobQueue, JobRequest } from './types.ts';

export function createInlineJobQueue(): JobQueue {
  let registered: JobHandlerMap | undefined;

  return {
    async start() {
      // No background worker connection needed for inline execution.
    },
    async stop() {
      registered = undefined;
    },
    async enqueue(job: JobRequest): Promise<string | null> {
      if (!registered) {
        return null;
      }
      switch (job.name) {
        case JOB_NAMES.ORDER_RECEIPT:
          await registered[JOB_NAMES.ORDER_RECEIPT](job.payload);
          return null;
        case JOB_NAMES.LOW_STOCK_ALERT:
          await registered[JOB_NAMES.LOW_STOCK_ALERT](job.payload);
          return null;
        case JOB_NAMES.EXPORT_STORE_BOOKS_CSV:
          await registered[JOB_NAMES.EXPORT_STORE_BOOKS_CSV](job.payload);
          return null;
      }
    },
    async registerHandlers(handlers: JobHandlerMap): Promise<void> {
      registered = handlers;
    },
  };
}
