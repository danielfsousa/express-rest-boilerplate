import type { CreateOrderInput, Order, OrderItem, OrderStatus } from '@starter/contracts';
import { orderStatusSchema, storeMetadataSchema } from '@starter/contracts';
import {
  and,
  books,
  customers,
  desc,
  eq,
  gte,
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
import { createOrderCheckoutSession } from '../billing/billing.service.ts';
import type { ResolvedStoreContext } from '../books/books.service.ts';
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
    | {
        ok: true;
        order: Order;
        resolvedLines: Array<{
          bookId: string;
          title: string;
          sku: string;
          currency: string;
          quantity: number;
          unitPriceCents: number;
          newStock: number;
        }>;
      }
    | { ok: false; status: 404 | 409; error: string };
  try {
    result = await withStoreContext(db, store.id, async (tx) => {
      const resolvedLines: Array<{
        bookId: string;
        title: string;
        sku: string;
        currency: string;
        quantity: number;
        unitPriceCents: number;
        newStock: number;
      }> = [];

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

      const [existingCustomer] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.storeId, store.id), eq(customers.email, input.customerEmail)))
        .limit(1);

      let customerRow: typeof customers.$inferSelect | undefined;
      if (existingCustomer) {
        const [updatedCustomer] = await tx
          .update(customers)
          .set({ name: input.customerName, locale: input.customerLocale })
          .where(eq(customers.id, existingCustomer.id))
          .returning();
        customerRow = updatedCustomer ?? existingCustomer;
      } else {
        const [insertedCustomer] = await tx
          .insert(customers)
          .values({
            storeId: store.id,
            email: input.customerEmail,
            name: input.customerName,
            locale: input.customerLocale,
          })
          .returning();
        customerRow = insertedCustomer;
      }

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

      const insertedItems: Array<OrderItem> = [];
      for (const line of resolvedLines) {
        const [itemRow] = await tx
          .insert(orderItems)
          .values({
            storeId: store.id,
            orderId: orderRow.id,
            bookId: line.bookId,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
          })
          .returning();
        if (itemRow) {
          insertedItems.push(toOrderItem(itemRow, { title: line.title, sku: line.sku }));
        }
      }

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
    const [storeInfo] = await db
      .select({ name: organization.name, metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, store.id))
      .limit(1);

    let parsedThreshold = 5;
    if (storeInfo?.metadata) {
      try {
        const parsedMeta = storeMetadataSchema.safeParse(JSON.parse(storeInfo.metadata));
        if (parsedMeta.success && typeof parsedMeta.data.lowStockThreshold === 'number') {
          parsedThreshold = parsedMeta.data.lowStockThreshold;
        }
      } catch {
        parsedThreshold = 5;
      }
    }

    const storeName = storeInfo?.name ?? store.slug;
    const threshold = parsedThreshold;
    const locale: Locale = input.customerLocale === 'pt-BR' ? 'pt-BR' : 'en';

    if (!billing?.enabled) {
      await jobQueue.enqueue({
        name: JOB_NAMES.ORDER_RECEIPT,
        payload: {
          storeId: store.id,
          storeName,
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
      });
    }

    const lowStockLines = result.resolvedLines.filter((line) => line.newStock <= threshold);
    if (lowStockLines.length > 0) {
      const owners = await db
        .select({ email: user.email })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(and(eq(member.organizationId, store.id), eq(member.role, 'owner')));

      for (const line of lowStockLines) {
        for (const owner of owners) {
          await jobQueue.enqueue({
            name: JOB_NAMES.LOW_STOCK_ALERT,
            payload: {
              storeId: store.id,
              storeName,
              ownerEmail: owner.email,
              bookId: line.bookId,
              bookTitle: line.title,
              sku: line.sku,
              stock: line.newStock,
              threshold,
              locale,
            },
          });
        }
      }
    }
  }

  return result;
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

    const result: Array<Order> = [];
    for (const row of orderRows) {
      const itemRows = await tx
        .select({
          item: orderItems,
          title: books.title,
          sku: books.sku,
        })
        .from(orderItems)
        .innerJoin(books, eq(orderItems.bookId, books.id))
        .where(eq(orderItems.orderId, row.order.id));

      result.push(
        toOrder(
          row.order,
          { email: row.customerEmail, name: row.customerName },
          itemRows.map((entry) => toOrderItem(entry.item, { title: entry.title, sku: entry.sku })),
        ),
      );
    }

    return result;
  });
}

export async function getOrderForStore(
  db: Database,
  store: ResolvedStoreContext,
  orderId: string,
): Promise<Order | null> {
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

export async function updateOrderStatusForStore(
  db: Database,
  store: ResolvedStoreContext,
  orderId: string,
  nextStatus: OrderStatus,
): Promise<UpdateOrderStatusResult> {
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
