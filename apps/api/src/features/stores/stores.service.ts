import type { CreateStoreInput, Store, UpdateStoreInput } from '@starter/contracts';
import { createStoresRepository } from '@starter/db';
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
  const storesRepo = createStoresRepository(db);
  if (!multiTenancyEnabled) {
    const row = await storesRepo.findDefaultStore();
    return row ? [toStore(row, 'owner')] : [];
  }

  const rows = await storesRepo.listForUser(userId);
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

  const storesRepo = createStoresRepository(db);
  const existing = await storesRepo.findBySlug(input.slug);
  if (existing) {
    return { ok: false, status: 409, error: 'Store slug already exists' };
  }

  const created = await storesRepo.createWithOwner({
    storeId: crypto.randomUUID(),
    memberId: crypto.randomUUID(),
    userId,
    name: input.name,
    slug: input.slug,
    metadata: JSON.stringify({ lowStockThreshold: input.lowStockThreshold }),
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
  const storesRepo = createStoresRepository(db);
  const row = multiTenancyEnabled
    ? await storesRepo.findBySlug(slug)
    : await storesRepo.findDefaultStore();

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
  const storesRepo = createStoresRepository(db);
  const target = multiTenancyEnabled
    ? await storesRepo.findBySlug(slug)
    : await storesRepo.findDefaultStore();

  if (!target) {
    return { ok: false, status: 404, error: 'Store not found' };
  }

  if (multiTenancyEnabled) {
    const membership = await storesRepo.findMembership(target.id, userId);
    if (!membership || membership.role !== 'owner') {
      return { ok: false, status: 403, error: 'Owner role required' };
    }
  }

  const currentMeta = parseStoreMetadata(target.metadata);
  const nextMeta = {
    lowStockThreshold: input.lowStockThreshold ?? currentMeta.lowStockThreshold,
  };

  const updated = await storesRepo.updateById(
    target.id,
    input.name !== undefined
      ? { metadata: JSON.stringify(nextMeta), name: input.name }
      : { metadata: JSON.stringify(nextMeta) },
  );

  if (!updated) {
    return { ok: false, status: 404, error: 'Store not found' };
  }

  return { ok: true, store: toStore(updated, 'owner') };
}
