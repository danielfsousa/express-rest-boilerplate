import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import type { JobQueue } from '@starter/jobs';
import type { ObjectStorage } from '@starter/runtime/storage';
import { getSessionUser } from '../auth/auth.service.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import { resolveStoreContext } from '../books/books.service.ts';
import { createBooksExportRoute, getExportRoute, listExportsRoute } from './exports.routes.ts';
import {
  createBooksExportForStore,
  getExportForStore,
  listExportsForStore,
} from './exports.service.ts';

export interface CreateExportsRouterOptions {
  drizzleDb: Database;
  auth: AuthInstance;
  multiTenancyEnabled: boolean;
  storage?: ObjectStorage | undefined;
  jobQueue?: JobQueue | undefined;
}

export function createExportsRouter({
  drizzleDb,
  auth,
  multiTenancyEnabled,
  storage,
  jobQueue,
}: CreateExportsRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(createBooksExportRoute, async (c) => {
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

    const created = await createBooksExportForStore({
      db: drizzleDb,
      store,
      userId: sessionUser.id,
      jobQueue,
    });
    return c.json(created, 202);
  });

  router.openapi(listExportsRoute, async (c) => {
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

    const items = await listExportsForStore({ db: drizzleDb, store });
    return c.json({ items }, 200);
  });

  router.openapi(getExportRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { storeSlug, exportId } = c.req.valid('param');
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

    const exp = await getExportForStore({ db: drizzleDb, store, exportId });
    if (!exp) {
      return c.json({ error: 'Export not found' }, 404);
    }
    return c.json(exp, 200);
  });

  router.get('/api/v1/stores/:storeSlug/exports/:exportId/download', async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const storeSlug = c.req.param('storeSlug');
    const exportId = c.req.param('exportId');
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

    const exp = await getExportForStore({ db: drizzleDb, store, exportId });
    if (!exp || !exp.fileKey || !storage) {
      return c.json({ error: 'Export file not found' }, 404);
    }

    const stored = await storage.getObject(exp.fileKey);
    if (!stored) {
      return c.json({ error: 'Export file not found' }, 404);
    }

    return new Response(new Uint8Array(stored.body), {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="books-${store.slug}-${exp.id}.csv"`,
      },
    });
  });

  return router;
}
