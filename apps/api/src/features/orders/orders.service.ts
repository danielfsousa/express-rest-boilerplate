import type { CreateOrderInput, Order, OrderItem, OrderStatus } from '@starter/contracts';
import { orderStatusSchema } from '@starter/contracts';
import { createOrdersRepository, createStoresRepository, withStoreTransaction } from '@starter/db';
import type { Database, orderItems, orders } from '@starter/db';
import type { Locale } from '@starter/i18n';
import { JOB_NAMES } from '@starter/jobs';
import type { JobQueue } from '@starter/jobs';
import type { RealtimeBroker } from '@starter/runtime/realtime';
import type { ResolvedStoreContext } from '#/middleware/store-context.ts';
import type { PaymentGateway } from '../billing/billing.service.ts';
import {
  publishOrderCreatedEvent,
  publishOrderStatusChangedEvent,
} from '../realtime/realtime.handlers.ts';
import {
  calculateOrderTotalCents,
  canTransitionOrderStatus,
  shouldRestoreStockOnTransition,
} from './orders.domain.ts';

class OrderTxAbort extends Error {
  readonly status: 404 | 409;

  constructor(status: 404 | 409, message: string) {
    super(message);
    this.status = status;
  }
}

function isOrderTxAbort(error: unknown): error is OrderTxAbort {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error.status === 404 || error.status === 409) &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

function toOrderItem(
  row: typeof orderItems.$inferSelect,
  book: { title: string; sku: string },
): OrderItem {
  return {
    id: row.id,
    bookId: row.bookId,
    title: book.title,
    sku: book.sku,
    quantity: row.quantity,
    unitPriceCents: row.unitPriceCents,
  };
}

function toOrder(
  orderRow: typeof orders.$inferSelect,
  customerRow: { email: string; name: string },
  items: Array<OrderItem>,
): Order {
  return {
    id: orderRow.id,
    storeId: orderRow.storeId,
    customerId: orderRow.customerId,
    customerEmail: customerRow.email,
    customerName: customerRow.name,
    status: orderStatusSchema.parse(orderRow.status),
    totalCents: orderRow.totalCents,
    currency: orderRow.currency,
    stripeCheckoutSessionId: orderRow.stripeCheckoutSessionId,
    items,
    createdAt: orderRow.createdAt.toISOString(),
    updatedAt: orderRow.updatedAt.toISOString(),
  };
}

function normalizeLocale(value: string | undefined, i18nEnabled = true): Locale {
  if (!i18nEnabled) {
    return 'en';
  }
  return value === 'pt-BR' ? 'pt-BR' : 'en';
}

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; status: 404 | 409; error: string };

export interface OrderBillingContext {
  enabled: boolean;
  paymentGateway: PaymentGateway;
  webOrigin: string;
}

export interface CreateOrderParams {
  db: Database;
  store: ResolvedStoreContext;
  input: CreateOrderInput;
  billing?: OrderBillingContext | undefined;
  jobQueue?: JobQueue | undefined;
  realtimeBroker?: RealtimeBroker | undefined;
  i18nEnabled?: boolean | undefined;
}

interface ResolvedOrderLine {
  bookId: string;
  title: string;
  sku: string;
  currency: string;
  quantity: number;
  unitPriceCents: number;
  newStock: number;
}

export async function createOrderForStore({
  db,
  store,
  input,
  billing,
  jobQueue,
  realtimeBroker,
  i18nEnabled = true,
}: CreateOrderParams): Promise<CreateOrderResult> {
  const aggregated = new Map<string, number>();
  for (const item of input.items) {
    aggregated.set(item.bookId, (aggregated.get(item.bookId) ?? 0) + item.quantity);
  }
  const sortedItems = [...aggregated.entries()].toSorted(([a], [b]) => a.localeCompare(b));

  let result:
    | { ok: true; order: Order; resolvedLines: Array<ResolvedOrderLine> }
    | { ok: false; status: 404 | 409; error: string };

  try {
    result = await withStoreTransaction(db, store.id, async (repos) => {
      const resolvedLines: Array<ResolvedOrderLine> = [];

      for (const [bookId, quantity] of sortedItems) {
        const decremented = await repos.books.decrementPublishedStock(bookId, quantity);

        if (!decremented) {
          const existing = await repos.books.findById(bookId);

          if (!existing || !existing.published) {
            throw new OrderTxAbort(404, `Book ${bookId} not found`);
          }
          throw new OrderTxAbort(409, `Insufficient stock for "${existing.title}"`);
        }

        resolvedLines.push({
          bookId: decremented.id,
          title: decremented.title,
          sku: decremented.sku,
          currency: decremented.currency,
          quantity,
          unitPriceCents: decremented.priceCents,
          newStock: decremented.stock,
        });
      }

      const customerRow = await repos.orders.upsertCustomer({
        email: input.customerEmail,
        name: input.customerName,
        locale: input.customerLocale,
      });

      if (!customerRow) {
        throw new OrderTxAbort(409, 'Unable to record customer');
      }

      const distinctCurrencies = new Set(resolvedLines.map((line) => line.currency));
      if (distinctCurrencies.size > 1) {
        throw new OrderTxAbort(409, 'All items in an order must share the same currency');
      }

      const totalCents = calculateOrderTotalCents(resolvedLines);
      const currency = resolvedLines[0]?.currency ?? 'USD';

      const orderRow = await repos.orders.create({
        customerId: customerRow.id,
        status: billing?.enabled ? 'pending_payment' : 'paid',
        totalCents,
        currency,
      });

      if (!orderRow) {
        throw new OrderTxAbort(409, 'Unable to create order');
      }

      const insertedItemRows = await repos.orders.insertItems(
        resolvedLines.map((line) => ({
          orderId: orderRow.id,
          bookId: line.bookId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
      );

      const lineMetaByBookId = new Map(
        resolvedLines.map((line) => [line.bookId, { title: line.title, sku: line.sku }]),
      );
      const insertedItems = insertedItemRows.map((row) =>
        toOrderItem(row, lineMetaByBookId.get(row.bookId) ?? { title: '', sku: '' }),
      );

      return {
        ok: true as const,
        order: toOrder(orderRow, customerRow, insertedItems),
        resolvedLines,
      };
    });
  } catch (error: unknown) {
    if (isOrderTxAbort(error)) {
      return { ok: false, status: error.status, error: error.message };
    }
    throw error;
  }

  if (result.ok && billing?.enabled) {
    const session = await billing.paymentGateway.createOrderCheckoutSession({
      storeSlug: store.slug,
      order: result.order,
      webOrigin: billing.webOrigin,
    });
    const ordersRepo = createOrdersRepository(db, store.id);
    await ordersRepo.updateCheckoutSession(result.order.id, session.sessionId);
    result.order.stripeCheckoutSessionId = session.sessionId;
    result.order.checkoutUrl = session.url;
  }

  if (result.ok && jobQueue) {
    const locale = normalizeLocale(input.customerLocale, i18nEnabled);
    const jobsToEnqueue: Array<Promise<string | null>> = [];

    if (!billing?.enabled) {
      jobsToEnqueue.push(
        jobQueue.enqueue({
          name: JOB_NAMES.ORDER_RECEIPT,
          payload: {
            storeId: store.id,
            storeName: store.name,
            orderId: result.order.id,
            customerEmail: result.order.customerEmail,
            customerName: result.order.customerName,
            locale,
            totalCents: result.order.totalCents,
            currency: result.order.currency,
            items: result.order.items.map((item) => ({
              title: item.title,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
            })),
          },
        }),
      );
    }

    const lowStockLines = result.resolvedLines.filter(
      (line) => line.newStock <= store.lowStockThreshold,
    );
    if (lowStockLines.length > 0) {
      const storesRepo = createStoresRepository(db);
      const owners = await storesRepo.listOwnerEmails(store.id);

      for (const line of lowStockLines) {
        for (const owner of owners) {
          jobsToEnqueue.push(
            jobQueue.enqueue({
              name: JOB_NAMES.LOW_STOCK_ALERT,
              payload: {
                storeId: store.id,
                storeName: store.name,
                ownerEmail: owner.email,
                bookId: line.bookId,
                bookTitle: line.title,
                sku: line.sku,
                stock: line.newStock,
                threshold: store.lowStockThreshold,
                locale,
              },
            }),
          );
        }
      }
    }

    await Promise.all(jobsToEnqueue);
  }

  if (result.ok) {
    await publishOrderCreatedEvent({ broker: realtimeBroker, order: result.order });
  }

  return result.ok ? { ok: true, order: result.order } : result;
}

export interface SettlePaidOrderParams {
  db: Database;
  storeId: string;
  orderId: string;
  jobQueue?: JobQueue | undefined;
  realtimeBroker?: RealtimeBroker | undefined;
}

export async function settlePaidOrder({
  db,
  storeId,
  orderId,
  jobQueue,
  realtimeBroker,
}: SettlePaidOrderParams): Promise<boolean> {
  const settled = await withStoreTransaction(db, storeId, async (repos) => {
    const existing = await repos.orders.findWithCustomerById(orderId);
    if (!existing) {
      return null;
    }

    const currentStatus = orderStatusSchema.parse(existing.order.status);
    if (!canTransitionOrderStatus(currentStatus, 'paid')) {
      return null;
    }

    await repos.orders.updateStatus(orderId, 'paid');
    const [itemRows, storeRow] = await Promise.all([
      repos.orders.listItemsWithBooks(orderId),
      repos.stores.findById(storeId),
    ]);

    return {
      orderRow: existing.order,
      customerEmail: existing.customerEmail,
      customerName: existing.customerName,
      customerLocale: existing.customerLocale,
      storeName: storeRow?.name ?? storeId,
      items: itemRows.map((entry) => ({
        title: entry.title,
        quantity: entry.item.quantity,
        unitPriceCents: entry.item.unitPriceCents,
      })),
    };
  });

  if (!settled) {
    return false;
  }

  if (jobQueue) {
    await jobQueue.enqueue({
      name: JOB_NAMES.ORDER_RECEIPT,
      payload: {
        storeId,
        storeName: settled.storeName,
        orderId: settled.orderRow.id,
        customerEmail: settled.customerEmail,
        customerName: settled.customerName,
        locale: normalizeLocale(settled.customerLocale),
        totalCents: settled.orderRow.totalCents,
        currency: settled.orderRow.currency,
        items: settled.items,
      },
    });
  }

  await publishOrderStatusChangedEvent({
    broker: realtimeBroker,
    storeId,
    orderId,
    status: 'paid',
  });

  return true;
}

export async function listOrdersForStore(
  db: Database,
  store: ResolvedStoreContext,
): Promise<Array<Order>> {
  return await withStoreTransaction(db, store.id, async (repos) => {
    const orderRows = await repos.orders.listWithCustomer();

    if (orderRows.length === 0) {
      return [];
    }

    const orderIds = orderRows.map((row) => row.order.id);
    const allItemRows = await repos.orders.listItemsWithBooksForOrders(orderIds);

    const itemsByOrderId = new Map<string, Array<OrderItem>>();
    for (const entry of allItemRows) {
      const list = itemsByOrderId.get(entry.item.orderId) ?? [];
      list.push(toOrderItem(entry.item, { title: entry.title, sku: entry.sku }));
      itemsByOrderId.set(entry.item.orderId, list);
    }

    return orderRows.map((row) =>
      toOrder(
        row.order,
        { email: row.customerEmail, name: row.customerName },
        itemsByOrderId.get(row.order.id) ?? [],
      ),
    );
  });
}

export interface GetOrderParams {
  db: Database;
  store: ResolvedStoreContext;
  orderId: string;
}

export async function getOrderForStore({
  db,
  store,
  orderId,
}: GetOrderParams): Promise<Order | null> {
  return await withStoreTransaction(db, store.id, async (repos) => {
    const row = await repos.orders.findWithCustomerById(orderId);
    if (!row) {
      return null;
    }

    const itemRows = await repos.orders.listItemsWithBooks(row.order.id);

    return toOrder(
      row.order,
      { email: row.customerEmail, name: row.customerName },
      itemRows.map((entry) => toOrderItem(entry.item, { title: entry.title, sku: entry.sku })),
    );
  });
}

export type UpdateOrderStatusResult =
  | { ok: true; order: Order }
  | { ok: false; status: 404 | 409; error: string };

export interface UpdateOrderStatusParams {
  db: Database;
  store: ResolvedStoreContext;
  orderId: string;
  nextStatus: OrderStatus;
  realtimeBroker?: RealtimeBroker | undefined;
}

export async function updateOrderStatusForStore({
  db,
  store,
  orderId,
  nextStatus,
  realtimeBroker,
}: UpdateOrderStatusParams): Promise<UpdateOrderStatusResult> {
  const result: UpdateOrderStatusResult = await withStoreTransaction(
    db,
    store.id,
    async (repos) => {
      const existing = await repos.orders.findWithCustomerById(orderId);
      if (!existing) {
        return { ok: false, status: 404, error: 'Order not found' };
      }

      const prevStatus = orderStatusSchema.parse(existing.order.status);
      if (!canTransitionOrderStatus(prevStatus, nextStatus)) {
        return {
          ok: false,
          status: 409,
          error: `Cannot transition order from ${prevStatus} to ${nextStatus}`,
        };
      }

      const updated = await repos.orders.updateStatus(orderId, nextStatus);
      const itemRows = await repos.orders.listItemsWithBooks(orderId);

      if (shouldRestoreStockOnTransition(prevStatus, nextStatus)) {
        for (const entry of itemRows) {
          await repos.books.incrementStock(entry.item.bookId, entry.item.quantity);
        }
      }

      const finalRow = updated ?? existing.order;
      return {
        ok: true as const,
        order: toOrder(
          finalRow,
          { email: existing.customerEmail, name: existing.customerName },
          itemRows.map((entry) => toOrderItem(entry.item, { title: entry.title, sku: entry.sku })),
        ),
      };
    },
  );

  if (result.ok) {
    await publishOrderStatusChangedEvent({
      broker: realtimeBroker,
      storeId: store.id,
      orderId,
      status: result.order.status,
    });
  }

  return result;
}
