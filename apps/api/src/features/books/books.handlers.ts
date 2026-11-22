import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import type { ObjectStorage } from '@starter/runtime/storage';
import { resolveMerchantStore, resolvePublicStore } from '#/middleware/store-context.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import {
  createBookRoute,
  deleteBookRoute,
  getBookRoute,
  listBooksRoute,
  updateBookRoute,
  uploadBookCoverRoute,
} from './books.routes.ts';
import {
  createBookForStore,
  deleteBookForStore,
  getBookCover,
  getBookForStore,
  listBooksForStore,
  updateBookForStore,
  uploadBookCover,
} from './books.service.ts';

function isUploadedFile(value: unknown): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    typeof value.arrayBuffer === 'function' &&
    'type' in value &&
    typeof value.type === 'string' &&
    'size' in value &&
    typeof value.size === 'number'
  );
}

export interface CreateBooksRouterOptions {
  drizzleDb: Database;
  auth: AuthInstance;
  multiTenancyEnabled: boolean;
  billingEnabled?: boolean | undefined;
  storage?: ObjectStorage | undefined;
}

export function createBooksRouter({
  drizzleDb,
  auth,
  multiTenancyEnabled,
  billingEnabled = false,
  storage,
}: CreateBooksRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(listBooksRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const store = await resolvePublicStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const query = c.req.valid('query');
    const result = await listBooksForStore({ db: drizzleDb, store, query });
    return c.json(result, 200);
  });

  router.openapi(createBookRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const ctx = await resolveMerchantStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const body = c.req.valid('json');
    const result = await createBookForStore({
      db: drizzleDb,
      store: ctx.store,
      input: body,
      billingEnabled,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.book, 201);
  });

  router.openapi(getBookRoute, async (c) => {
    const { storeSlug, bookId } = c.req.valid('param');
    const store = await resolvePublicStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const book = await getBookForStore({ db: drizzleDb, store, bookId });
    if (!book) {
      return c.json({ error: 'Book not found' }, 404);
    }

    return c.json(book, 200);
  });

  router.openapi(updateBookRoute, async (c) => {
    const { storeSlug, bookId } = c.req.valid('param');
    const ctx = await resolveMerchantStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const body = c.req.valid('json');
    const result = await updateBookForStore({
      db: drizzleDb,
      store: ctx.store,
      bookId,
      input: body,
      billingEnabled,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.book, 200);
  });

  router.openapi(deleteBookRoute, async (c) => {
    const { storeSlug, bookId } = c.req.valid('param');
    const ctx = await resolveMerchantStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const deleted = await deleteBookForStore({ db: drizzleDb, store: ctx.store, bookId, storage });
    if (!deleted) {
      return c.json({ error: 'Book not found' }, 404);
    }

    return c.json({ deleted: true }, 200);
  });

  router.openapi(uploadBookCoverRoute, async (c) => {
    const { storeSlug, bookId } = c.req.valid('param');
    const ctx = await resolveMerchantStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const formData = await c.req.formData();
    const fileEntry = formData.get('file');
    if (!isUploadedFile(fileEntry)) {
      return c.json({ error: 'Missing file field in multipart form data' }, 400);
    }

    const result = await uploadBookCover({
      db: drizzleDb,
      store: ctx.store,
      bookId,
      file: fileEntry,
      storage,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({ coverKey: result.coverKey, coverUrl: result.coverUrl }, 200);
  });

  router.get('/api/v1/stores/:storeSlug/books/:bookId/cover', async (c) => {
    const store = await resolvePublicStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug: c.req.param('storeSlug'),
      multiTenancyEnabled,
    });
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const cover = await getBookCover({
      db: drizzleDb,
      store,
      bookId: c.req.param('bookId'),
      storage,
    });
    if (!cover) {
      return c.json({ error: 'Cover not found' }, 404);
    }

    const body = new Uint8Array(cover.body);
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': cover.contentType,
        'cache-control': 'public, max-age=3600',
      },
    });
  });

  return router;
}
