import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import type { DatabaseTransaction, DbExecutor } from './client.ts';
import { withStoreContext } from './context.ts';
import {
  books,
  customers,
  member,
  orderItems,
  orders,
  organization,
  session,
  storeExports,
  subscription,
  user,
} from './schema/index.ts';
import { DEFAULT_STORE_ID, ensureDefaultStore } from './seed.ts';

export interface StoreRepositoryOptions {
  inStoreContext?: boolean | undefined;
}

interface RunInStoreParams<T> {
  db: DbExecutor;
  storeId: string;
  inStoreContext: boolean;
  fn: (tx: DbExecutor) => Promise<T>;
}

async function runInStore<T>({ db, storeId, inStoreContext, fn }: RunInStoreParams<T>): Promise<T> {
  if (inStoreContext) {
    return await fn(db);
  }
  return await withStoreContext(db, storeId, fn);
}

export function createStoresRepository(db: DbExecutor) {
  return {
    async findBySlug(slug: string) {
      const [row] = await db
        .select()
        .from(organization)
        .where(eq(organization.slug, slug))
        .limit(1);
      return row ?? null;
    },

    async findById(storeId: string) {
      const [row] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, storeId))
        .limit(1);
      return row ?? null;
    },

    async findDefaultStore() {
      await ensureDefaultStore(db);
      const [row] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, DEFAULT_STORE_ID))
        .limit(1);
      return row ?? null;
    },

    async findMembership(storeId: string, userId: string) {
      const [row] = await db
        .select()
        .from(member)
        .where(and(eq(member.organizationId, storeId), eq(member.userId, userId)))
        .limit(1);
      return row ?? null;
    },

    async listForUser(userId: string) {
      return await db
        .select({
          store: organization,
          role: member.role,
        })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(eq(member.userId, userId));
    },

    async listOwnerEmails(storeId: string) {
      return await db
        .select({ email: user.email })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(and(eq(member.organizationId, storeId), eq(member.role, 'owner')));
    },

    async createWithOwner(params: {
      storeId: string;
      memberId: string;
      userId: string;
      name: string;
      slug: string;
      metadata: string;
    }) {
      return await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(organization)
          .values({
            id: params.storeId,
            name: params.name,
            slug: params.slug,
            metadata: params.metadata,
          })
          .returning();

        await tx.insert(member).values({
          id: params.memberId,
          organizationId: params.storeId,
          userId: params.userId,
          role: 'owner',
        });

        return inserted ?? null;
      });
    },

    async updateById(storeId: string, patch: Partial<typeof organization.$inferInsert>) {
      const [updated] = await db
        .update(organization)
        .set(patch)
        .where(eq(organization.id, storeId))
        .returning();
      return updated ?? null;
    },
  };
}

export function createBooksRepository(
  db: DbExecutor,
  storeId: string,
  options?: StoreRepositoryOptions,
) {
  const inStoreContext = options?.inStoreContext ?? false;

  return {
    async findById(bookId: string) {
      const [row] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select()
            .from(books)
            .where(and(eq(books.id, bookId), eq(books.storeId, storeId)))
            .limit(1),
      });
      return row ?? null;
    },

    async listAllOrdered() {
      return await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select({
              id: books.id,
              sku: books.sku,
              title: books.title,
              author: books.author,
              priceCents: books.priceCents,
              currency: books.currency,
              stock: books.stock,
              published: books.published,
            })
            .from(books)
            .where(eq(books.storeId, storeId))
            .orderBy(asc(books.createdAt)),
      });
    },

    async countPublished() {
      const [row] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select({ count: sql<number>`count(*)::int` })
            .from(books)
            .where(and(eq(books.storeId, storeId), eq(books.published, true))),
      });
      return row?.count ?? 0;
    },

    async create(values: Omit<typeof books.$inferInsert, 'storeId'>) {
      const [created] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .insert(books)
            .values({
              ...values,
              storeId,
            })
            .returning(),
      });
      return created ?? null;
    },

    async updateById(bookId: string, patch: Partial<typeof books.$inferInsert>) {
      const [updated] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .update(books)
            .set(patch)
            .where(and(eq(books.id, bookId), eq(books.storeId, storeId)))
            .returning(),
      });
      return updated ?? null;
    },

    async decrementPublishedStock(bookId: string, quantity: number) {
      const [decremented] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .update(books)
            .set({
              stock: sql`${books.stock} - ${quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(books.id, bookId),
                eq(books.storeId, storeId),
                eq(books.published, true),
                gte(books.stock, quantity),
              ),
            )
            .returning(),
      });
      return decremented ?? null;
    },

    async incrementStock(bookId: string, quantity: number) {
      const [incremented] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .update(books)
            .set({
              stock: sql`${books.stock} + ${quantity}`,
              updatedAt: new Date(),
            })
            .where(and(eq(books.id, bookId), eq(books.storeId, storeId)))
            .returning(),
      });
      return incremented ?? null;
    },

    async deleteById(bookId: string) {
      const [deleted] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .delete(books)
            .where(and(eq(books.id, bookId), eq(books.storeId, storeId)))
            .returning({ id: books.id, coverKey: books.coverKey }),
      });
      return deleted ?? null;
    },
  };
}

export function createOrdersRepository(
  db: DbExecutor,
  storeId: string,
  options?: StoreRepositoryOptions,
) {
  const inStoreContext = options?.inStoreContext ?? false;

  return {
    async upsertCustomer(params: { email: string; name: string; locale: string }) {
      const [customerRow] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .insert(customers)
            .values({
              storeId,
              email: params.email,
              name: params.name,
              locale: params.locale,
            })
            .onConflictDoUpdate({
              target: [customers.storeId, customers.email],
              set: {
                name: params.name,
                locale: params.locale,
              },
            })
            .returning(),
      });
      return customerRow ?? null;
    },

    async create(params: {
      customerId: string;
      status: string;
      totalCents: number;
      currency: string;
    }) {
      const [orderRow] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .insert(orders)
            .values({
              storeId,
              customerId: params.customerId,
              status: params.status,
              totalCents: params.totalCents,
              currency: params.currency,
            })
            .returning(),
      });
      return orderRow ?? null;
    },

    async insertItems(
      items: Array<{
        orderId: string;
        bookId: string;
        quantity: number;
        unitPriceCents: number;
      }>,
    ) {
      if (items.length === 0) {
        return [];
      }
      return await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .insert(orderItems)
            .values(
              items.map((item) => ({
                storeId,
                orderId: item.orderId,
                bookId: item.bookId,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
              })),
            )
            .returning(),
      });
    },

    async updateCheckoutSession(orderId: string, sessionId: string) {
      const [updated] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .update(orders)
            .set({ stripeCheckoutSessionId: sessionId, updatedAt: new Date() })
            .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
            .returning(),
      });
      return updated ?? null;
    },

    async updateStatus(orderId: string, status: string) {
      const [updated] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .update(orders)
            .set({ status, updatedAt: new Date() })
            .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
            .returning(),
      });
      return updated ?? null;
    },

    async findWithCustomerById(orderId: string) {
      const [row] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select({
              order: orders,
              customerEmail: customers.email,
              customerName: customers.name,
              customerLocale: customers.locale,
            })
            .from(orders)
            .innerJoin(customers, eq(orders.customerId, customers.id))
            .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
            .limit(1),
      });
      return row ?? null;
    },

    async listWithCustomer() {
      return await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select({
              order: orders,
              customerEmail: customers.email,
              customerName: customers.name,
            })
            .from(orders)
            .innerJoin(customers, eq(orders.customerId, customers.id))
            .where(eq(orders.storeId, storeId))
            .orderBy(desc(orders.createdAt)),
      });
    },

    async listItemsWithBooks(orderId: string) {
      return await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select({
              item: orderItems,
              title: books.title,
              sku: books.sku,
            })
            .from(orderItems)
            .innerJoin(books, eq(orderItems.bookId, books.id))
            .where(and(eq(orderItems.orderId, orderId), eq(orderItems.storeId, storeId))),
      });
    },

    async listItemsWithBooksForOrders(orderIds: Array<string>) {
      if (orderIds.length === 0) {
        return [];
      }
      return await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select({
              item: orderItems,
              title: books.title,
              sku: books.sku,
            })
            .from(orderItems)
            .innerJoin(books, eq(orderItems.bookId, books.id))
            .where(and(inArray(orderItems.orderId, orderIds), eq(orderItems.storeId, storeId))),
      });
    },
  };
}

export function createExportsRepository(
  db: DbExecutor,
  storeId: string,
  options?: StoreRepositoryOptions,
) {
  const inStoreContext = options?.inStoreContext ?? false;

  return {
    async create(requestedByUserId: string) {
      const [inserted] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .insert(storeExports)
            .values({
              storeId,
              requestedByUserId,
              status: 'queued',
            })
            .returning(),
      });
      return inserted ?? null;
    },

    async findById(exportId: string) {
      const [row] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select()
            .from(storeExports)
            .where(and(eq(storeExports.id, exportId), eq(storeExports.storeId, storeId)))
            .limit(1),
      });
      return row ?? null;
    },

    async list(limit = 25) {
      return await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .select()
            .from(storeExports)
            .where(eq(storeExports.storeId, storeId))
            .orderBy(desc(storeExports.createdAt))
            .limit(limit),
      });
    },

    async updateStatus(params: {
      exportId: string;
      status: string;
      fileKey?: string | null | undefined;
      completedAt?: Date | null | undefined;
    }) {
      const patch: Partial<typeof storeExports.$inferInsert> = {
        status: params.status,
      };
      if (params.fileKey !== undefined) {
        patch.fileKey = params.fileKey;
      }
      if (params.completedAt !== undefined) {
        patch.completedAt = params.completedAt;
      }
      const [updated] = await runInStore({
        db,
        storeId,
        inStoreContext,
        fn: async (tx) =>
          tx
            .update(storeExports)
            .set(patch)
            .where(and(eq(storeExports.id, params.exportId), eq(storeExports.storeId, storeId)))
            .returning(),
      });
      return updated ?? null;
    },
  };
}

export function createSubscriptionsRepository(db: DbExecutor) {
  return {
    async findByStoreId(storeId: string) {
      const [row] = await db
        .select()
        .from(subscription)
        .where(eq(subscription.referenceId, storeId))
        .limit(1);
      return row ?? null;
    },

    async upsertForStore(params: {
      storeId: string;
      plan: string;
      status: string;
      stripeCustomerId?: string | undefined;
      stripeSubscriptionId?: string | undefined;
    }) {
      const existing = await this.findByStoreId(params.storeId);
      if (existing) {
        const patch: Partial<typeof subscription.$inferInsert> = {
          plan: params.plan,
          status: params.status,
        };
        if (params.stripeCustomerId !== undefined) {
          patch.stripeCustomerId = params.stripeCustomerId;
        }
        if (params.stripeSubscriptionId !== undefined) {
          patch.stripeSubscriptionId = params.stripeSubscriptionId;
        }
        await db.update(subscription).set(patch).where(eq(subscription.id, existing.id));
        return existing.id;
      }

      const id = crypto.randomUUID();
      await db.insert(subscription).values({
        id,
        plan: params.plan,
        referenceId: params.storeId,
        status: params.status,
        stripeCustomerId: params.stripeCustomerId ?? null,
        stripeSubscriptionId: params.stripeSubscriptionId ?? null,
      });
      return id;
    },
  };
}

export function createUsersRepository(db: DbExecutor) {
  return {
    async findById(userId: string) {
      const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
      return row ?? null;
    },

    async updateById(userId: string, patch: Partial<typeof user.$inferInsert>) {
      const [updated] = await db.update(user).set(patch).where(eq(user.id, userId)).returning();
      return updated ?? null;
    },

    async deleteSessionsForUser(userId: string) {
      await db.delete(session).where(eq(session.userId, userId));
    },
  };
}

export function createRepositories(db: DbExecutor) {
  return {
    stores: createStoresRepository(db),
    subscriptions: createSubscriptionsRepository(db),
    users: createUsersRepository(db),
    forStore(storeId: string, options?: StoreRepositoryOptions) {
      return {
        books: createBooksRepository(db, storeId, options),
        orders: createOrdersRepository(db, storeId, options),
        exports: createExportsRepository(db, storeId, options),
      };
    },
  };
}

export interface StoreTransactionRepositories {
  tx: DatabaseTransaction;
  stores: ReturnType<typeof createStoresRepository>;
  subscriptions: ReturnType<typeof createSubscriptionsRepository>;
  users: ReturnType<typeof createUsersRepository>;
  books: ReturnType<typeof createBooksRepository>;
  orders: ReturnType<typeof createOrdersRepository>;
  exports: ReturnType<typeof createExportsRepository>;
}

export interface TransactionRepositories {
  tx: DatabaseTransaction;
  stores: ReturnType<typeof createStoresRepository>;
  subscriptions: ReturnType<typeof createSubscriptionsRepository>;
  users: ReturnType<typeof createUsersRepository>;
  forStore: (
    storeId: string,
    options?: StoreRepositoryOptions,
  ) => {
    books: ReturnType<typeof createBooksRepository>;
    orders: ReturnType<typeof createOrdersRepository>;
    exports: ReturnType<typeof createExportsRepository>;
  };
  withStore: <T>(
    storeId: string,
    fn: (storeRepos: StoreTransactionRepositories) => Promise<T>,
  ) => Promise<T>;
}

function createStoreScopedRepos(
  tx: DatabaseTransaction,
  storeId: string,
): StoreTransactionRepositories {
  const opts: StoreRepositoryOptions = { inStoreContext: true };
  return {
    tx,
    stores: createStoresRepository(tx),
    subscriptions: createSubscriptionsRepository(tx),
    users: createUsersRepository(tx),
    books: createBooksRepository(tx, storeId, opts),
    orders: createOrdersRepository(tx, storeId, opts),
    exports: createExportsRepository(tx, storeId, opts),
  };
}

export async function withTransaction<T>(
  db: DbExecutor,
  fn: (repos: TransactionRepositories) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    const base = createRepositories(tx);
    return await fn({
      tx,
      ...base,
      withStore: async (storeId, storeFn) => {
        await tx.execute(sql`SELECT set_config('app.current_store_id', ${storeId}, true)`);
        return await storeFn(createStoreScopedRepos(tx, storeId));
      },
    });
  });
}

export async function withStoreTransaction<T>(
  db: DbExecutor,
  storeId: string,
  fn: (repos: StoreTransactionRepositories) => Promise<T>,
): Promise<T> {
  return await withStoreContext(db, storeId, async (tx) => fn(createStoreScopedRepos(tx, storeId)));
}
