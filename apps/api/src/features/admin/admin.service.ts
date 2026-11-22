import type {
  AdminOverviewResponse,
  AdminStoreSummary,
  AdminUpdateStorePlanInput,
  AdminUpdateUserInput,
  AdminUserSummary,
} from '@starter/contracts';
import {
  and,
  books,
  desc,
  eq,
  member,
  orders,
  organization,
  session,
  sql,
  subscription,
  user,
  withStoreContext,
} from '@starter/db';
import type { Database } from '@starter/db';

async function buildAdminStoreSummary(
  db: Database,
  storeRow: typeof organization.$inferSelect,
): Promise<AdminStoreSummary> {
  const [subRow] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.referenceId, storeRow.id))
    .limit(1);

  const [memberCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(member)
    .where(eq(member.organizationId, storeRow.id));

  const tenantMetrics = await withStoreContext(db, storeRow.id, async (tx) => {
    const [bookRow] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(books)
      .where(and(eq(books.storeId, storeRow.id), eq(books.published, true)));

    const [orderRow] = await tx
      .select({
        count: sql<number>`count(*)::int`,
        revenueCents: sql<number>`coalesce(sum(case when ${orders.status} in ('paid', 'fulfilled') then ${orders.totalCents} else 0 end), 0)::int`,
      })
      .from(orders)
      .where(eq(orders.storeId, storeRow.id));

    return {
      publishedBookCount: bookRow?.count ?? 0,
      orderCount: orderRow?.count ?? 0,
      revenueCents: orderRow?.revenueCents ?? 0,
    };
  });

  const isProActive =
    subRow && subRow.plan === 'pro' && (subRow.status === 'active' || subRow.status === 'trialing');

  return {
    id: storeRow.id,
    slug: storeRow.slug,
    name: storeRow.name,
    plan: isProActive ? 'pro' : 'free',
    subscriptionStatus: subRow?.status ?? 'active',
    memberCount: memberCountRow?.count ?? 0,
    publishedBookCount: tenantMetrics.publishedBookCount,
    orderCount: tenantMetrics.orderCount,
    revenueCents: tenantMetrics.revenueCents,
    createdAt: storeRow.createdAt.toISOString(),
  };
}

async function buildAdminUserSummary(
  db: Database,
  userRow: typeof user.$inferSelect,
): Promise<AdminUserSummary> {
  const [storeCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(member)
    .where(eq(member.userId, userRow.id));

  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role === 'admin' ? 'admin' : 'user',
    banned: userRow.banned,
    banReason: userRow.banReason ?? null,
    storeCount: storeCountRow?.count ?? 0,
    createdAt: userRow.createdAt.toISOString(),
  };
}

export async function getAdminOverview(db: Database): Promise<AdminOverviewResponse> {
  const storeRows = await db.select().from(organization).orderBy(desc(organization.createdAt));
  const userRows = await db.select().from(user).orderBy(desc(user.createdAt));

  const stores: Array<AdminStoreSummary> = [];
  for (const storeRow of storeRows) {
    stores.push(await buildAdminStoreSummary(db, storeRow));
  }

  const users: Array<AdminUserSummary> = [];
  for (const userRow of userRows) {
    users.push(await buildAdminUserSummary(db, userRow));
  }

  const activeProStores = stores.filter((s) => s.plan === 'pro').length;
  const totalOrders = stores.reduce((acc, s) => acc + s.orderCount, 0);
  const totalRevenueCents = stores.reduce((acc, s) => acc + s.revenueCents, 0);

  return {
    totalStores: stores.length,
    activeProStores,
    totalUsers: users.length,
    totalOrders,
    totalRevenueCents,
    stores,
    users,
  };
}

export interface UpdateAdminStorePlanParams {
  db: Database;
  storeSlug: string;
  input: AdminUpdateStorePlanInput;
}

export async function updateAdminStorePlan({
  db,
  storeSlug,
  input,
}: UpdateAdminStorePlanParams): Promise<AdminStoreSummary | null> {
  const [storeRow] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, storeSlug))
    .limit(1);

  if (!storeRow) {
    return null;
  }

  const [existingSub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.referenceId, storeRow.id))
    .limit(1);

  if (existingSub) {
    await db
      .update(subscription)
      .set({
        plan: input.plan,
        status: input.status,
      })
      .where(eq(subscription.id, existingSub.id));
  } else {
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      plan: input.plan,
      referenceId: storeRow.id,
      status: input.status,
    });
  }

  return await buildAdminStoreSummary(db, storeRow);
}

export interface UpdateAdminUserParams {
  db: Database;
  userId: string;
  input: AdminUpdateUserInput;
}

export async function updateAdminUser({
  db,
  userId,
  input,
}: UpdateAdminUserParams): Promise<AdminUserSummary | null> {
  const [existing] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!existing) {
    return null;
  }

  const patch: Partial<typeof user.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.role !== undefined) {
    patch.role = input.role;
  }
  if (input.banned !== undefined) {
    patch.banned = input.banned;
    if (!input.banned) {
      patch.banReason = null;
      patch.banExpires = null;
    }
  }
  if (input.banReason !== undefined) {
    patch.banReason = input.banReason;
  }

  const [updated] = await db.update(user).set(patch).where(eq(user.id, userId)).returning();
  if (!updated) {
    return null;
  }

  if (input.banned === true) {
    await db.delete(session).where(eq(session.userId, userId));
  }

  return await buildAdminUserSummary(db, updated);
}
