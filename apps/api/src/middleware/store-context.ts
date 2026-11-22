import { storeMetadataSchema } from '@starter/contracts';
import type { StoreMetadata } from '@starter/contracts';
import { and, DEFAULT_STORE_ID, ensureDefaultStore, eq, member, organization } from '@starter/db';
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
  if (!multiTenancyEnabled) {
    await ensureDefaultStore(db);
  }

  const [store] = await db
    .select({
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      metadata: organization.metadata,
    })
    .from(organization)
    .where(
      multiTenancyEnabled
        ? eq(organization.slug, storeSlug)
        : eq(organization.id, DEFAULT_STORE_ID),
    )
    .limit(1);

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

  const [membership] = await db
    .select({ id: member.id, role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, store.id), eq(member.userId, userId)))
    .limit(1);

  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    lowStockThreshold: metadata.lowStockThreshold,
    isMember: membership !== undefined,
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
  const user = await getSessionUser(auth, headers);
  if (!user) {
    return { ok: false, status: 401, error: 'Authentication required' };
  }

  const store = await resolveStoreContext({
    db,
    storeSlug,
    userId: user.id,
    multiTenancyEnabled,
  });
  if (!store) {
    return { ok: false, status: 404, error: 'Store not found' };
  }
  if (!store.isMember) {
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
