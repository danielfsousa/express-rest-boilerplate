import type { Locale } from '@starter/i18n';

export const JOB_NAMES = {
  ORDER_RECEIPT: 'email.order-receipt',
  LOW_STOCK_ALERT: 'email.low-stock-alert',
  EXPORT_STORE_BOOKS_CSV: 'export.store-books-csv',
} as const;

export interface OrderReceiptJobPayload {
  storeId: string;
  storeName: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  locale: Locale;
  totalCents: number;
  currency: string;
  items: Array<{
    title: string;
    quantity: number;
    unitPriceCents: number;
  }>;
}

export interface LowStockAlertJobPayload {
  storeId: string;
  storeName: string;
  ownerEmail: string;
  bookId: string;
  bookTitle: string;
  sku: string;
  stock: number;
  threshold: number;
  locale: Locale;
}

export interface ExportStoreBooksCsvJobPayload {
  storeId: string;
  exportId: string;
}

export interface JobPayloadMap {
  [JOB_NAMES.ORDER_RECEIPT]: OrderReceiptJobPayload;
  [JOB_NAMES.LOW_STOCK_ALERT]: LowStockAlertJobPayload;
  [JOB_NAMES.EXPORT_STORE_BOOKS_CSV]: ExportStoreBooksCsvJobPayload;
}

export type JobName = keyof JobPayloadMap;

export type JobRequest =
  | { name: typeof JOB_NAMES.ORDER_RECEIPT; payload: OrderReceiptJobPayload }
  | { name: typeof JOB_NAMES.LOW_STOCK_ALERT; payload: LowStockAlertJobPayload }
  | { name: typeof JOB_NAMES.EXPORT_STORE_BOOKS_CSV; payload: ExportStoreBooksCsvJobPayload };

export type JobHandler<K extends JobName> = (payload: JobPayloadMap[K]) => Promise<void>;

export type JobHandlerMap = {
  [K in JobName]: JobHandler<K>;
};

export interface JobQueue {
  start(): Promise<void>;
  stop(): Promise<void>;
  enqueue(job: JobRequest): Promise<string | null>;
  registerHandlers(handlers: JobHandlerMap): Promise<void>;
}
