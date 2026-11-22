import { storeMetadataSchema } from '@starter/contracts';
import type { StoreMetadata } from '@starter/contracts';
import { createStoresRepository } from '@starter/db';
import type { Database } from '@starter/db';
import { getSessionUser } from '../features/auth/auth.service.ts';
import type { AuthInstance } from '../features/auth/auth.service.ts';

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export interface ResolvedStoreContext {
  id: string;
  slug: string;
  name: string;
  lowStockThreshold: number;
  isMember: boolean;
  memberRole: string | null;
}

export function parseStoreMetadata(raw: string | null): StoreMetadata {
  if (!raw) {
    return { lowStockThreshold: 5 };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return storeMetadataSchema.parse(parsed);
  } catch {
    return { lowStockThreshold: 5 };
  }
}

export type ResolveAuthUserResult =
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401; error: string };

export async function resolveAuthenticatedUser(
  auth: AuthInstance,
  headers: Headers,
): Promise<ResolveAuthUserResult> {
  const user = await getSessionUser(auth, headers);
  if (!user) {
    return { ok: false, status: 401, error: 'Authentication required' };
  }
  return { ok: true, user };
}

export type ResolvePlatformAdminResult =
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401 | 403; error: string };

export async function resolvePlatformAdmin(
  auth: AuthInstance,
  headers: Headers,
): Promise<ResolvePlatformAdminResult> {
  const authResult = await resolveAuthenticatedUser(auth, headers);
  if (!authResult.ok) {
    return authResult;
  }
  if (authResult.user.role !== 'admin') {
    return { ok: false, status: 403, error: 'Admin role required' };
  }
  return authResult;
}

export interface ResolveStoreContextParams {
  db: Database;
  storeSlug: string;
  userId: string | null;
  multiTenancyEnabled: boolean;
}

export async function resolveStoreContext({
  db,
  storeSlug,
  userId,
  multiTenancyEnabled,
}: ResolveStoreContextParams): Promise<ResolvedStoreContext | null> {
  const storesRepo = createStoresRepository(db);
  const store = multiTenancyEnabled
    ? await storesRepo.findBySlug(storeSlug)
    : await storesRepo.findDefaultStore();

  if (!store) {
    return null;
  }

  const metadata = parseStoreMetadata(store.metadata);

  if (!userId) {
    return {
      id: store.id,
      slug: store.slug,
      name: store.name,
      lowStockThreshold: metadata.lowStockThreshold,
      isMember: false,
      memberRole: null,
    };
  }

  if (!multiTenancyEnabled) {
    return {
      id: store.id,
      slug: store.slug,
      name: store.name,
      lowStockThreshold: metadata.lowStockThreshold,
      isMember: true,
      memberRole: 'owner',
    };
  }

  const membership = await storesRepo.findMembership(store.id, userId);

  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    lowStockThreshold: metadata.lowStockThreshold,
    isMember: membership !== null,
    memberRole: membership?.role ?? null,
  };
}

export interface ResolveMerchantStoreParams {
  db: Database;
  auth: AuthInstance;
  headers: Headers;
  storeSlug: string;
  multiTenancyEnabled: boolean;
}

export type ResolveMerchantStoreResult =
  | { ok: true; user: SessionUser; store: ResolvedStoreContext }
  | { ok: false; status: 401 | 403 | 404; error: string };

export async function resolveMerchantStore({
  db,
  auth,
  headers,
  storeSlug,
  multiTenancyEnabled,
}: ResolveMerchantStoreParams): Promise<ResolveMerchantStoreResult> {
  const authResult = await resolveAuthenticatedUser(auth, headers);
  if (!authResult.ok) {
    return authResult;
  }
  const { user } = authResult;

  const store = await resolveStoreContext({
    db,
    storeSlug,
    userId: user.id,
    multiTenancyEnabled,
  });
  if (!store) {
    return { ok: false, status: 404, error: 'Store not found' };
  }
  if (!store.isMember && user.role !== 'admin') {
    return { ok: false, status: 403, error: 'Store membership required' };
  }

  return { ok: true, user, store };
}

export interface ResolvePublicStoreParams {
  db: Database;
  auth?: AuthInstance | undefined;
  headers?: Headers | undefined;
  storeSlug: string;
  multiTenancyEnabled: boolean;
}

export async function resolvePublicStore({
  db,
  auth,
  headers,
  storeSlug,
  multiTenancyEnabled,
}: ResolvePublicStoreParams): Promise<ResolvedStoreContext | null> {
  const user = auth && headers ? await getSessionUser(auth, headers) : null;
  return resolveStoreContext({
    db,
    storeSlug,
    userId: user?.id ?? null,
    multiTenancyEnabled,
  });
}
