import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import type { JobQueue } from '@starter/jobs';
import type { ObjectStorage } from '@starter/runtime/storage';
import { resolveMerchantStore } from '../../middleware/store-context.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
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

    const created = await createBooksExportForStore({
      db: drizzleDb,
      store: ctx.store,
      userId: ctx.user.id,
      jobQueue,
    });
    return c.json(created, 202);
  });

  router.openapi(listExportsRoute, async (c) => {
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

    const items = await listExportsForStore({ db: drizzleDb, store: ctx.store });
    return c.json({ items }, 200);
  });

  router.openapi(getExportRoute, async (c) => {
    const { storeSlug, exportId } = c.req.valid('param');
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

    const exp = await getExportForStore({ db: drizzleDb, store: ctx.store, exportId });
    if (!exp) {
      return c.json({ error: 'Export not found' }, 404);
    }
    return c.json(exp, 200);
  });

  router.get('/api/v1/stores/:storeSlug/exports/:exportId/download', async (c) => {
    const ctx = await resolveMerchantStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug: c.req.param('storeSlug'),
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const exp = await getExportForStore({
      db: drizzleDb,
      store: ctx.store,
      exportId: c.req.param('exportId'),
    });
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
        'content-disposition': `attachment; filename="books-${ctx.store.slug}-${exp.id}.csv"`,
      },
    });
  });

  return router;
}
