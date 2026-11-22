import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import type { ObjectStorage } from '@starter/runtime/storage';
import { getSessionUser } from '../auth/auth.service.ts';
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
  resolveStoreContext,
  updateBookForStore,
  uploadBookCover,
} from './books.service.ts';

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.type === 'string'
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
    const query = c.req.valid('query');
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);

    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser?.id ?? null,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const result = await listBooksForStore(drizzleDb, store, query);
    return c.json(result, 200);
  });

  router.openapi(createBookRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { storeSlug } = c.req.valid('param');
    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser.id,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }
    if (!store.isMember) {
      return c.json({ error: 'Store membership required' }, 403);
    }

    const body = c.req.valid('json');
    const result = await createBookForStore(drizzleDb, store, body, billingEnabled);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.book, 201);
  });

  router.openapi(getBookRoute, async (c) => {
    const { storeSlug, bookId } = c.req.valid('param');
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);

    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser?.id ?? null,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const book = await getBookForStore(drizzleDb, store, bookId);
    if (!book) {
      return c.json({ error: 'Book not found' }, 404);
    }

    return c.json(book, 200);
  });

  router.openapi(updateBookRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { storeSlug, bookId } = c.req.valid('param');
    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser.id,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }
    if (!store.isMember) {
      return c.json({ error: 'Store membership required' }, 403);
    }

    const body = c.req.valid('json');
    const result = await updateBookForStore(drizzleDb, store, bookId, body, billingEnabled);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.book, 200);
  });

  router.openapi(deleteBookRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { storeSlug, bookId } = c.req.valid('param');
    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser.id,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }
    if (!store.isMember) {
      return c.json({ error: 'Store membership required' }, 403);
    }

    const deleted = await deleteBookForStore(drizzleDb, store, bookId, storage);
    if (!deleted) {
      return c.json({ error: 'Book not found' }, 404);
    }

    return c.json({ deleted: true as const }, 200);
  });

  router.openapi(uploadBookCoverRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { storeSlug, bookId } = c.req.valid('param');
    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser.id,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }
    if (!store.isMember) {
      return c.json({ error: 'Store membership required' }, 403);
    }

    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!isUploadFile(file)) {
      return c.json({ error: 'Multipart field "file" is required' }, 400);
    }

    const result = await uploadBookCover(drizzleDb, store, bookId, file, storage);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({ coverKey: result.coverKey, coverUrl: result.coverUrl }, 200);
  });

  router.get('/api/v1/stores/:storeSlug/books/:bookId/cover', async (c) => {
    const storeSlug = c.req.param('storeSlug');
    const bookId = c.req.param('bookId');
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);

    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser?.id ?? null,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const cover = await getBookCover(drizzleDb, store, bookId, storage);
    if (!cover) {
      return c.json({ error: 'Cover not found' }, 404);
    }

    return new Response(new Uint8Array(cover.body), {
      status: 200,
      headers: {
        'content-type': cover.contentType,
        'cache-control': 'public, max-age=3600',
      },
    });
  });

  return router;
}
