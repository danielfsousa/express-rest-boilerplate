import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from './client.ts';
import { withStoreContext } from './context.ts';
import {
  books,
  member,
  organization,
  session,
  storeExports,
  subscription,
  user,
} from './schema/index.ts';
import { DEFAULT_STORE_ID, ensureDefaultStore } from './seed.ts';

export function createStoresRepository(db: Database) {
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

export function createBooksRepository(db: Database, storeId: string) {
  return {
    async findById(bookId: string) {
      const [row] = await withStoreContext(db, storeId, async (tx) =>
        tx
          .select()
          .from(books)
          .where(and(eq(books.id, bookId), eq(books.storeId, storeId)))
          .limit(1),
      );
      return row ?? null;
    },

    async countPublished() {
      const [row] = await withStoreContext(db, storeId, async (tx) =>
        tx
          .select({ count: sql<number>`count(*)::int` })
          .from(books)
          .where(and(eq(books.storeId, storeId), eq(books.published, true))),
      );
      return row?.count ?? 0;
    },

    async create(values: Omit<typeof books.$inferInsert, 'storeId'>) {
      const [created] = await withStoreContext(db, storeId, async (tx) =>
        tx
          .insert(books)
          .values({
            ...values,
            storeId,
          })
          .returning(),
      );
      return created ?? null;
    },

    async updateById(bookId: string, patch: Partial<typeof books.$inferInsert>) {
      const [updated] = await withStoreContext(db, storeId, async (tx) =>
        tx
          .update(books)
          .set(patch)
          .where(and(eq(books.id, bookId), eq(books.storeId, storeId)))
          .returning(),
      );
      return updated ?? null;
    },

    async deleteById(bookId: string) {
      const [deleted] = await withStoreContext(db, storeId, async (tx) =>
        tx
          .delete(books)
          .where(and(eq(books.id, bookId), eq(books.storeId, storeId)))
          .returning({ id: books.id, coverKey: books.coverKey }),
      );
      return deleted ?? null;
    },
  };
}

export function createExportsRepository(db: Database, storeId: string) {
  return {
    async create(requestedByUserId: string) {
      const [inserted] = await withStoreContext(db, storeId, async (tx) =>
        tx
          .insert(storeExports)
          .values({
            storeId,
            requestedByUserId,
            status: 'queued',
          })
          .returning(),
      );
      return inserted ?? null;
    },

    async findById(exportId: string) {
      const [row] = await withStoreContext(db, storeId, async (tx) =>
        tx
          .select()
          .from(storeExports)
          .where(and(eq(storeExports.id, exportId), eq(storeExports.storeId, storeId)))
          .limit(1),
      );
      return row ?? null;
    },

    async list(limit = 25) {
      return await withStoreContext(db, storeId, async (tx) =>
        tx
          .select()
          .from(storeExports)
          .where(eq(storeExports.storeId, storeId))
          .orderBy(desc(storeExports.createdAt))
          .limit(limit),
      );
    },
  };
}

export function createSubscriptionsRepository(db: Database) {
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

export function createUsersRepository(db: Database) {
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
