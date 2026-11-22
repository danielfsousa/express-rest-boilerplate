import type { CreateOrderInput, Order, OrderItem, OrderStatus } from '@starter/contracts';
import { orderStatusSchema } from '@starter/contracts';
import {
  and,
  books,
  customers,
  desc,
  eq,
  gte,
  inArray,
  member,
  orderItems,
  orders,
  organization,
  sql,
  user,
  withStoreContext,
} from '@starter/db';
import type { Database } from '@starter/db';
import type { Locale } from '@starter/i18n';
import { JOB_NAMES } from '@starter/jobs';
import type { JobQueue } from '@starter/jobs';
import type Stripe from 'stripe';
import type { ResolvedStoreContext } from '../../middleware/store-context.ts';
import { createOrderCheckoutSession } from '../billing/billing.service.ts';
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

function normalizeLocale(value: string | undefined): Locale {
  return value === 'pt-BR' ? 'pt-BR' : 'en';
}

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; status: 404 | 409; error: string };

export interface OrderBillingContext {
  enabled: boolean;
  stripe: Stripe;
  webOrigin: string;
}

export interface CreateOrderParams {
  db: Database;
  store: ResolvedStoreContext;
  input: CreateOrderInput;
  billing?: OrderBillingContext | undefined;
  jobQueue?: JobQueue | undefined;
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
    result = await withStoreContext(db, store.id, async (tx) => {
      const resolvedLines: Array<ResolvedOrderLine> = [];

      for (const [bookId, quantity] of sortedItems) {
        const [decremented] = await tx
          .update(books)
          .set({
            stock: sql`${books.stock} - ${quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(books.id, bookId),
              eq(books.storeId, store.id),
              eq(books.published, true),
              gte(books.stock, quantity),
            ),
          )
          .returning();

        if (!decremented) {
          const [existing] = await tx
            .select({ id: books.id, published: books.published, title: books.title })
            .from(books)
            .where(and(eq(books.id, bookId), eq(books.storeId, store.id)))
            .limit(1);

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

      const [customerRow] = await tx
        .insert(customers)
        .values({
          storeId: store.id,
          email: input.customerEmail,
          name: input.customerName,
          locale: input.customerLocale,
        })
        .onConflictDoUpdate({
          target: [customers.storeId, customers.email],
          set: {
            name: input.customerName,
            locale: input.customerLocale,
          },
        })
        .returning();

      if (!customerRow) {
        throw new OrderTxAbort(409, 'Unable to record customer');
      }

      const totalCents = calculateOrderTotalCents(resolvedLines);
      const currency = resolvedLines[0]?.currency ?? 'USD';

      const [orderRow] = await tx
        .insert(orders)
        .values({
          storeId: store.id,
          customerId: customerRow.id,
          status: billing?.enabled ? 'pending_payment' : 'paid',
          totalCents,
          currency,
        })
        .returning();

      if (!orderRow) {
        throw new OrderTxAbort(409, 'Unable to create order');
      }

      const insertedItemRows = await tx
        .insert(orderItems)
        .values(
          resolvedLines.map((line) => ({
            storeId: store.id,
            orderId: orderRow.id,
            bookId: line.bookId,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
          })),
        )
        .returning();

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
    const session = await createOrderCheckoutSession({
      stripe: billing.stripe,
      storeSlug: store.slug,
      order: result.order,
      webOrigin: billing.webOrigin,
    });
    await withStoreContext(db, store.id, async (tx) =>
      tx
        .update(orders)
        .set({ stripeCheckoutSessionId: session.sessionId, updatedAt: new Date() })
        .where(and(eq(orders.id, result.order.id), eq(orders.storeId, store.id))),
    );
    result.order.stripeCheckoutSessionId = session.sessionId;
    result.order.checkoutUrl = session.url;
  }

  if (result.ok && jobQueue) {
    const locale = normalizeLocale(input.customerLocale);
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
      const owners = await db
        .select({ email: user.email })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(and(eq(member.organizationId, store.id), eq(member.role, 'owner')));

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

  return result.ok ? { ok: true, order: result.order } : result;
}

export interface SettlePaidOrderParams {
  db: Database;
  storeId: string;
  orderId: string;
  jobQueue?: JobQueue | undefined;
}

export async function settlePaidOrder({
  db,
  storeId,
  orderId,
  jobQueue,
}: SettlePaidOrderParams): Promise<boolean> {
  const settled = await withStoreContext(db, storeId, async (tx) => {
    const [orderRow] = await tx
      .select({
        id: orders.id,
        status: orders.status,
        totalCents: orders.totalCents,
        currency: orders.currency,
        customerEmail: customers.email,
        customerName: customers.name,
        customerLocale: customers.locale,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
      .limit(1);

    if (!orderRow) {
      return null;
    }

    const currentStatus = orderStatusSchema.parse(orderRow.status);
    if (!canTransitionOrderStatus(currentStatus, 'paid')) {
      return null;
    }

    await tx
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));

    const items = await tx
      .select({
        title: books.title,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
      })
      .from(orderItems)
      .innerJoin(books, eq(orderItems.bookId, books.id))
      .where(and(eq(orderItems.orderId, orderId), eq(orderItems.storeId, storeId)));

    return { orderRow, items };
  });

  if (!settled) {
    return false;
  }

  if (jobQueue) {
    const [storeRow] = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, storeId))
      .limit(1);

    await jobQueue.enqueue({
      name: JOB_NAMES.ORDER_RECEIPT,
      payload: {
        storeId,
        storeName: storeRow?.name ?? storeId,
        orderId: settled.orderRow.id,
        customerEmail: settled.orderRow.customerEmail,
        customerName: settled.orderRow.customerName,
        locale: normalizeLocale(settled.orderRow.customerLocale),
        totalCents: settled.orderRow.totalCents,
        currency: settled.orderRow.currency,
        items: settled.items,
      },
    });
  }

  return true;
}

export async function listOrdersForStore(
  db: Database,
  store: ResolvedStoreContext,
): Promise<Array<Order>> {
  return await withStoreContext(db, store.id, async (tx) => {
    const orderRows = await tx
      .select({
        order: orders,
        customerEmail: customers.email,
        customerName: customers.name,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.storeId, store.id))
      .orderBy(desc(orders.createdAt));

    if (orderRows.length === 0) {
      return [];
    }

    const orderIds = orderRows.map((row) => row.order.id);
    const allItemRows = await tx
      .select({
        item: orderItems,
        title: books.title,
        sku: books.sku,
      })
      .from(orderItems)
      .innerJoin(books, eq(orderItems.bookId, books.id))
      .where(inArray(orderItems.orderId, orderIds));

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
  return await withStoreContext(db, store.id, async (tx) => {
    const [row] = await tx
      .select({
        order: orders,
        customerEmail: customers.email,
        customerName: customers.name,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(orders.id, orderId), eq(orders.storeId, store.id)))
      .limit(1);

    if (!row) {
      return null;
    }

    const itemRows = await tx
      .select({
        item: orderItems,
        title: books.title,
        sku: books.sku,
      })
      .from(orderItems)
      .innerJoin(books, eq(orderItems.bookId, books.id))
      .where(eq(orderItems.orderId, row.order.id));

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
}

export async function updateOrderStatusForStore({
  db,
  store,
  orderId,
  nextStatus,
}: UpdateOrderStatusParams): Promise<UpdateOrderStatusResult> {
  return await withStoreContext(db, store.id, async (tx) => {
    const [existing] = await tx
      .select({
        order: orders,
        customerEmail: customers.email,
        customerName: customers.name,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(orders.id, orderId), eq(orders.storeId, store.id)))
      .limit(1);

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

    const [updated] = await tx
      .update(orders)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    const itemRows = await tx
      .select({
        item: orderItems,
        title: books.title,
        sku: books.sku,
      })
      .from(orderItems)
      .innerJoin(books, eq(orderItems.bookId, books.id))
      .where(eq(orderItems.orderId, orderId));

    if (shouldRestoreStockOnTransition(prevStatus, nextStatus)) {
      for (const entry of itemRows) {
        await tx
          .update(books)
          .set({
            stock: sql`${books.stock} + ${entry.item.quantity}`,
            updatedAt: new Date(),
          })
          .where(and(eq(books.id, entry.item.bookId), eq(books.storeId, store.id)));
      }
    }

    const finalRow = updated ?? existing.order;
    return {
      ok: true,
      order: toOrder(
        finalRow,
        { email: existing.customerEmail, name: existing.customerName },
        itemRows.map((entry) => toOrderItem(entry.item, { title: entry.title, sku: entry.sku })),
      ),
    };
  });
}
