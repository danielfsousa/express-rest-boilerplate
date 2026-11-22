import type { CreateStoreInput, Store, UpdateStoreInput } from '@starter/contracts';
import { and, DEFAULT_STORE_ID, ensureDefaultStore, eq, member, organization } from '@starter/db';
import type { Database } from '@starter/db';
import { parseStoreMetadata } from '#/middleware/store-context.ts';

function normalizeRole(role: string): 'owner' | 'staff' {
  return role === 'owner' ? 'owner' : 'staff';
}

function toStore(
  row: {
    id: string;
    slug: string;
    name: string;
    logo: string | null;
    metadata: string | null;
  },
  role?: string,
): Store {
  const metadata = parseStoreMetadata(row.metadata);
  const store: Store = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logo: row.logo,
    lowStockThreshold: metadata.lowStockThreshold,
  };
  if (role !== undefined) {
    store.role = normalizeRole(role);
  }
  return store;
}

export interface ListStoresParams {
  db: Database;
  userId: string;
  multiTenancyEnabled: boolean;
}

export async function listStoresForUser({
  db,
  userId,
  multiTenancyEnabled,
}: ListStoresParams): Promise<Array<Store>> {
  if (!multiTenancyEnabled) {
    await ensureDefaultStore(db);
    const [row] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, DEFAULT_STORE_ID))
      .limit(1);
    return row ? [toStore(row, 'owner')] : [];
  }

  const rows = await db
    .select({
      store: organization,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));

  return rows.map((item) => toStore(item.store, item.role));
}

export type CreateStoreResult =
  | { ok: true; store: Store }
  | { ok: false; status: 403 | 409; error: string };

export interface CreateStoreParams {
  db: Database;
  userId: string;
  input: CreateStoreInput;
  multiTenancyEnabled: boolean;
}

export async function createStoreForUser({
  db,
  userId,
  input,
  multiTenancyEnabled,
}: CreateStoreParams): Promise<CreateStoreResult> {
  if (!multiTenancyEnabled) {
    return {
      ok: false,
      status: 403,
      error: 'Store creation is disabled when multi-tenancy is off',
    };
  }

  const [existing] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, input.slug))
    .limit(1);

  if (existing) {
    return { ok: false, status: 409, error: 'Store slug already exists' };
  }

  const storeId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const created = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(organization)
      .values({
        id: storeId,
        name: input.name,
        slug: input.slug,
        metadata: JSON.stringify({ lowStockThreshold: input.lowStockThreshold }),
      })
      .returning();

    await tx.insert(member).values({
      id: memberId,
      organizationId: storeId,
      userId,
      role: 'owner',
    });

    return inserted;
  });

  if (!created) {
    return { ok: false, status: 409, error: 'Failed to create store' };
  }

  return { ok: true, store: toStore(created, 'owner') };
}

export interface GetStoreBySlugParams {
  db: Database;
  slug: string;
  multiTenancyEnabled: boolean;
}

export async function getStoreBySlug({
  db,
  slug,
  multiTenancyEnabled,
}: GetStoreBySlugParams): Promise<Store | null> {
  if (!multiTenancyEnabled) {
    await ensureDefaultStore(db);
    const [row] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, DEFAULT_STORE_ID))
      .limit(1);
    return row ? toStore(row) : null;
  }

  const [row] = await db.select().from(organization).where(eq(organization.slug, slug)).limit(1);

  return row ? toStore(row) : null;
}

export type UpdateStoreResult =
  | { ok: true; store: Store }
  | { ok: false; status: 403 | 404; error: string };

export interface UpdateStoreParams {
  db: Database;
  userId: string;
  slug: string;
  input: UpdateStoreInput;
  multiTenancyEnabled: boolean;
}

export async function updateStoreForUser({
  db,
  userId,
  slug,
  input,
  multiTenancyEnabled,
}: UpdateStoreParams): Promise<UpdateStoreResult> {
  if (!multiTenancyEnabled) {
    await ensureDefaultStore(db);
  }

  const [target] = await db
    .select()
    .from(organization)
    .where(
      multiTenancyEnabled ? eq(organization.slug, slug) : eq(organization.id, DEFAULT_STORE_ID),
    )
    .limit(1);

  if (!target) {
    return { ok: false, status: 404, error: 'Store not found' };
  }

  const [membership] = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, target.id), eq(member.userId, userId)))
    .limit(1);

  if (!membership || membership.role !== 'owner') {
    return { ok: false, status: 403, error: 'Owner role required' };
  }

  const currentMeta = parseStoreMetadata(target.metadata);
  const nextMeta = {
    lowStockThreshold: input.lowStockThreshold ?? currentMeta.lowStockThreshold,
  };

  const patch: Partial<typeof organization.$inferInsert> = {
    metadata: JSON.stringify(nextMeta),
  };
  if (input.name !== undefined) {
    patch.name = input.name;
  }

  const [updated] = await db
    .update(organization)
    .set(patch)
    .where(eq(organization.id, target.id))
    .returning();

  if (!updated) {
    return { ok: false, status: 404, error: 'Store not found' };
  }

  return { ok: true, store: toStore(updated, membership.role) };
}
