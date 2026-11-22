import type { StoreExport } from '@starter/contracts';
import { storeExportStatusSchema } from '@starter/contracts';
import { createExportsRepository } from '@starter/db';
import type { Database } from '@starter/db';
import { JOB_NAMES } from '@starter/jobs';
import type { JobQueue } from '@starter/jobs';
import type { ResolvedStoreContext } from '#/middleware/store-context.ts';

function toStoreExport(
  row: {
    id: string;
    storeId: string;
    requestedByUserId: string;
    status: string;
    fileKey: string | null;
    createdAt: Date;
    completedAt: Date | null;
  },
  storeSlug: string,
): StoreExport {
  const status = storeExportStatusSchema.parse(row.status);
  return {
    id: row.id,
    storeId: row.storeId,
    requestedByUserId: row.requestedByUserId,
    status,
    fileKey: row.fileKey,
    downloadUrl:
      status === 'completed' && row.fileKey
        ? `/api/v1/stores/${encodeURIComponent(storeSlug)}/exports/${encodeURIComponent(row.id)}/download`
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
  const exportsRepo = createExportsRepository(db, store.id);
  const inserted = await exportsRepo.create(userId);
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

  const latest = await exportsRepo.findById(inserted.id);
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
  const exportsRepo = createExportsRepository(db, store.id);
  const rows = await exportsRepo.list(25);
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
  const exportsRepo = createExportsRepository(db, store.id);
  const row = await exportsRepo.findById(exportId);
  return row ? toStoreExport(row, store.slug) : null;
}
