import { JOB_NAMES } from '../types.ts';
import type { JobHandlerMap, JobQueue } from '../types.ts';
import type { JobHandlersDeps } from './deps.ts';
import { createExportStoreBooksCsvHandler } from './export-store-books-csv.ts';
import { createLowStockAlertHandler } from './low-stock-alert.ts';
import { createOrderReceiptHandler } from './order-receipt.ts';

export type { JobHandlersDeps } from './deps.ts';
export { createExportStoreBooksCsvHandler } from './export-store-books-csv.ts';
export { createLowStockAlertHandler } from './low-stock-alert.ts';
export { createOrderReceiptHandler } from './order-receipt.ts';

export function createDefaultJobHandlers(deps: JobHandlersDeps): JobHandlerMap {
  return {
    [JOB_NAMES.ORDER_RECEIPT]: createOrderReceiptHandler(deps),
    [JOB_NAMES.LOW_STOCK_ALERT]: createLowStockAlertHandler(deps),
    [JOB_NAMES.EXPORT_STORE_BOOKS_CSV]: createExportStoreBooksCsvHandler(deps),
  };
}

export async function registerDefaultJobHandlers(
  queue: JobQueue,
  deps: JobHandlersDeps,
): Promise<void> {
  await queue.registerHandlers(createDefaultJobHandlers(deps));
}
