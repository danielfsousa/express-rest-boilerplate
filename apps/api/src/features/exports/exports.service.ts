import type { StoreExport } from '@starter/contracts';
import { storeExportStatusSchema } from '@starter/contracts';
import { and, desc, eq, storeExports, withStoreContext } from '@starter/db';
import type { Database } from '@starter/db';
import { JOB_NAMES } from '@starter/jobs';
import type { JobQueue } from '@starter/jobs';
import type { ResolvedStoreContext } from '../books/books.service.ts';

function toStoreExport(row: typeof storeExports.$inferSelect, storeSlug: string): StoreExport {
  const status = storeExportStatusSchema.parse(row.status);
  return {
    id: row.id,
    storeId: row.storeId,
    requestedByUserId: row.requestedByUserId,
    status,
    fileKey: row.fileKey,
    downloadUrl:
      status === 'completed' && row.fileKey
        ? `/api/v1/stores/${storeSlug}/exports/${row.id}/download`
        : null,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

export interface CreateBooksExportParams {
  db: Database;
  store: ResolvedStoreContext;
  userId: string;
  jobQueue?: JobQueue | undefined;
}

export async function createBooksExportForStore({
  db,
  store,
  userId,
  jobQueue,
}: CreateBooksExportParams): Promise<StoreExport> {
  const [inserted] = await withStoreContext(db, store.id, async (tx) =>
    tx
      .insert(storeExports)
      .values({
        storeId: store.id,
        requestedByUserId: userId,
        status: 'queued',
      })
      .returning(),
  );

  if (!inserted) {
    throw new Error('Failed to create export record');
  }

  if (jobQueue) {
    await jobQueue.enqueue({
      name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
      payload: {
        storeId: store.id,
        exportId: inserted.id,
      },
    });
  }

  const [latest] = await withStoreContext(db, store.id, async (tx) =>
    tx
      .select()
      .from(storeExports)
      .where(and(eq(storeExports.id, inserted.id), eq(storeExports.storeId, store.id)))
      .limit(1),
  );

  return toStoreExport(latest ?? inserted, store.slug);
}

export interface ListExportsParams {
  db: Database;
  store: ResolvedStoreContext;
}

export async function listExportsForStore({
  db,
  store,
}: ListExportsParams): Promise<Array<StoreExport>> {
  const rows = await withStoreContext(db, store.id, async (tx) =>
    tx
      .select()
      .from(storeExports)
      .where(eq(storeExports.storeId, store.id))
      .orderBy(desc(storeExports.createdAt))
      .limit(25),
  );

  return rows.map((row) => toStoreExport(row, store.slug));
}

export interface GetExportParams {
  db: Database;
  store: ResolvedStoreContext;
  exportId: string;
}

export async function getExportForStore({
  db,
  store,
  exportId,
}: GetExportParams): Promise<StoreExport | null> {
  const [row] = await withStoreContext(db, store.id, async (tx) =>
    tx
      .select()
      .from(storeExports)
      .where(and(eq(storeExports.id, exportId), eq(storeExports.storeId, store.id)))
      .limit(1),
  );

  return row ? toStoreExport(row, store.slug) : null;
}
