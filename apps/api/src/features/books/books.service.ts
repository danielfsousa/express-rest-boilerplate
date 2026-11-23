import type {
  Book,
  CreateBookInput,
  ListBooksQuery,
  ListBooksResponse,
  UpdateBookInput,
} from '@starter/contracts';
import {
  and,
  books,
  createBooksRepository,
  eq,
  ilike,
  or,
  sql,
  withStoreContext,
  withStoreTransaction,
} from '@starter/db';
import type { Database } from '@starter/db';
import type { ObjectStorage } from '@starter/runtime/storage';
import type { ResolvedStoreContext } from '#/middleware/store-context.ts';
import { assertCanPublishBook } from '../billing/billing.service.ts';

const ALLOWED_COVER_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const MAX_COVER_BYTES = 5 * 1024 * 1024;

function toBook(row: typeof books.$inferSelect, storeSlug: string): Book {
  return {
    id: row.id,
    storeId: row.storeId,
    sku: row.sku,
    title: row.title,
    author: row.author,
    description: row.description,
    priceCents: row.priceCents,
    currency: row.currency,
    stock: row.stock,
    coverKey: row.coverKey,
    coverUrl: row.coverKey
      ? `/api/v1/stores/${encodeURIComponent(storeSlug)}/books/${encodeURIComponent(row.id)}/cover`
      : null,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  if ('code' in error && error.code === '23505') {
    return true;
  }
  if ('cause' in error) {
    return isUniqueViolation(error.cause);
  }
  return false;
}

export interface ListBooksParams {
  db: Database;
  store: ResolvedStoreContext;
  query: ListBooksQuery;
}

export async function listBooksForStore({
  db,
  store,
  query,
}: ListBooksParams): Promise<ListBooksResponse> {
  return await withStoreContext(db, store.id, async (tx) => {
    const conditions = [eq(books.storeId, store.id)];
    if (!store.isMember || query.published === 'true') {
      conditions.push(eq(books.published, true));
    } else if (query.published === 'false') {
      conditions.push(eq(books.published, false));
    }
    if (query.q && query.q.trim().length > 0) {
      const pattern = `%${query.q.trim()}%`;
      const searchCond = or(ilike(books.title, pattern), ilike(books.author, pattern));
      if (searchCond) {
        conditions.push(searchCond);
      }
    }

    const whereClause = and(...conditions);

    const [rows, countRows] = await Promise.all([
      tx
        .select()
        .from(books)
        .where(whereClause)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(books.createdAt),
      tx
        .select({ count: sql<number>`count(*)::int` })
        .from(books)
        .where(whereClause),
    ]);

    return {
      books: rows.map((row) => toBook(row, store.slug)),
      total: countRows[0]?.count ?? 0,
      limit: query.limit,
      offset: query.offset,
    };
  });
}

export type CreateBookResult =
  | { ok: true; book: Book }
  | { ok: false; status: 402 | 409; error: string };

export interface CreateBookParams {
  db: Database;
  store: ResolvedStoreContext;
  input: CreateBookInput;
  billingEnabled?: boolean | undefined;
}

export async function createBookForStore({
  db,
  store,
  input,
  billingEnabled = false,
}: CreateBookParams): Promise<CreateBookResult> {
  try {
    return await withStoreTransaction(db, store.id, async (repos) => {
      if (input.published) {
        const check = await assertCanPublishBook({
          db: repos.tx,
          storeId: store.id,
          billingEnabled,
          inStoreContext: true,
        });
        if (!check.allowed) {
          return { ok: false, status: 402, error: check.error };
        }
      }

      const created = await repos.books.create({
        sku: input.sku,
        title: input.title,
        author: input.author,
        description: input.description,
        priceCents: input.priceCents,
        currency: input.currency,
        stock: input.stock,
        published: input.published,
      });

      if (!created) {
        return { ok: false, status: 409, error: 'Could not create book' };
      }
      return { ok: true, book: toBook(created, store.slug) };
    });
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        status: 409,
        error: 'A book with this SKU already exists in this store',
      };
    }
    throw error;
  }
}

export interface GetBookParams {
  db: Database;
  store: ResolvedStoreContext;
  bookId: string;
}

export async function getBookForStore({ db, store, bookId }: GetBookParams): Promise<Book | null> {
  const booksRepo = createBooksRepository(db, store.id);
  const row = await booksRepo.findById(bookId);

  if (!row || (!store.isMember && !row.published)) {
    return null;
  }

  return toBook(row, store.slug);
}

export type UpdateBookResult =
  | { ok: true; book: Book }
  | { ok: false; status: 402 | 404 | 409; error: string };

export interface UpdateBookParams {
  db: Database;
  store: ResolvedStoreContext;
  bookId: string;
  input: UpdateBookInput;
  billingEnabled?: boolean | undefined;
}

export async function updateBookForStore({
  db,
  store,
  bookId,
  input,
  billingEnabled = false,
}: UpdateBookParams): Promise<UpdateBookResult> {
  const patch: Partial<typeof books.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.sku !== undefined) {
    patch.sku = input.sku;
  }
  if (input.title !== undefined) {
    patch.title = input.title;
  }
  if (input.author !== undefined) {
    patch.author = input.author;
  }
  if (input.description !== undefined) {
    patch.description = input.description;
  }
  if (input.priceCents !== undefined) {
    patch.priceCents = input.priceCents;
  }
  if (input.currency !== undefined) {
    patch.currency = input.currency;
  }
  if (input.stock !== undefined) {
    patch.stock = input.stock;
  }
  if (input.published !== undefined) {
    patch.published = input.published;
  }

  try {
    return await withStoreTransaction(db, store.id, async (repos) => {
      if (input.published === true) {
        const existing = await repos.books.findById(bookId);
        if (existing && !existing.published) {
          const check = await assertCanPublishBook({
            db: repos.tx,
            storeId: store.id,
            billingEnabled,
            inStoreContext: true,
          });
          if (!check.allowed) {
            return { ok: false, status: 402, error: check.error };
          }
        }
      }

      const updated = await repos.books.updateById(bookId, patch);
      if (!updated) {
        return { ok: false, status: 404, error: 'Book not found' };
      }
      return { ok: true, book: toBook(updated, store.slug) };
    });
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        status: 409,
        error: 'A book with this SKU already exists in this store',
      };
    }
    throw error;
  }
}

export interface DeleteBookParams {
  db: Database;
  store: ResolvedStoreContext;
  bookId: string;
  storage?: ObjectStorage | undefined;
}

export async function deleteBookForStore({
  db,
  store,
  bookId,
  storage,
}: DeleteBookParams): Promise<boolean> {
  const booksRepo = createBooksRepository(db, store.id);
  const deleted = await booksRepo.deleteById(bookId);

  if (!deleted) {
    return false;
  }

  if (deleted.coverKey && storage) {
    await storage.deleteObject(deleted.coverKey);
  }

  return true;
}

export type UploadCoverResult =
  | { ok: true; coverKey: string; coverUrl: string }
  | { ok: false; status: 400 | 404 | 413 | 503; error: string };

export interface UploadBookCoverParams {
  db: Database;
  store: ResolvedStoreContext;
  bookId: string;
  file: File;
  storage?: ObjectStorage | undefined;
}

export async function uploadBookCover({
  db,
  store,
  bookId,
  file,
  storage,
}: UploadBookCoverParams): Promise<UploadCoverResult> {
  if (!storage) {
    return { ok: false, status: 503, error: 'Object storage is not configured' };
  }

  const ext = ALLOWED_COVER_TYPES.get(file.type);
  if (!ext) {
    return {
      ok: false,
      status: 400,
      error: 'Cover must be image/jpeg, image/png, or image/webp',
    };
  }

  if (file.size > MAX_COVER_BYTES) {
    return {
      ok: false,
      status: 413,
      error: 'Cover image exceeds 5 MB limit',
    };
  }

  const existing = await getBookForStore({ db, store, bookId });
  if (!existing) {
    return { ok: false, status: 404, error: 'Book not found' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const coverKey = `stores/${store.id}/books/${bookId}/cover.${ext}`;

  await storage.putObject({
    key: coverKey,
    body: bytes,
    contentType: file.type,
  });

  const booksRepo = createBooksRepository(db, store.id);
  await booksRepo.updateById(bookId, { coverKey, updatedAt: new Date() });

  if (existing.coverKey && existing.coverKey !== coverKey) {
    await storage.deleteObject(existing.coverKey);
  }

  return {
    ok: true,
    coverKey,
    coverUrl: `/api/v1/stores/${encodeURIComponent(store.slug)}/books/${encodeURIComponent(bookId)}/cover`,
  };
}

export interface GetBookCoverParams {
  db: Database;
  store: ResolvedStoreContext;
  bookId: string;
  storage?: ObjectStorage | undefined;
}

export async function getBookCover({
  db,
  store,
  bookId,
  storage,
}: GetBookCoverParams): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!storage) {
    return null;
  }

  const book = await getBookForStore({ db, store, bookId });
  if (!book?.coverKey) {
    return null;
  }

  return await storage.getObject(book.coverKey);
}
