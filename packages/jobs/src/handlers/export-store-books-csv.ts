import { createBooksRepository, createExportsRepository } from '@starter/db';
import { stringify } from 'csv-stringify/sync';
import type { JOB_NAMES, JobHandler } from '../types.ts';
import type { JobHandlersDeps } from './deps.ts';

export function createExportStoreBooksCsvHandler({
  db,
  storage,
  logger,
}: JobHandlersDeps): JobHandler<typeof JOB_NAMES.EXPORT_STORE_BOOKS_CSV> {
  return async (payload) => {
    const exportsRepo = createExportsRepository(db, payload.storeId);
    const booksRepo = createBooksRepository(db, payload.storeId);

    await exportsRepo.updateStatus({
      exportId: payload.exportId,
      status: 'processing',
    });

    try {
      const storeBooks = await booksRepo.listAllOrdered();
      const csv = stringify(storeBooks, {
        header: true,
        columns: ['id', 'sku', 'title', 'author', 'priceCents', 'currency', 'stock', 'published'],
        cast: {
          boolean: (value) => (value ? 'true' : 'false'),
        },
      });
      const fileKey = `stores/${payload.storeId}/exports/${payload.exportId}.csv`;

      await storage.putObject({
        key: fileKey,
        body: new TextEncoder().encode(csv),
        contentType: 'text/csv; charset=utf-8',
      });

      await exportsRepo.updateStatus({
        exportId: payload.exportId,
        status: 'completed',
        fileKey,
        completedAt: new Date(),
      });

      logger.info(
        { exportId: payload.exportId, storeId: payload.storeId, rowCount: storeBooks.length },
        'Completed store books CSV export',
      );
    } catch (error) {
      await exportsRepo.updateStatus({
        exportId: payload.exportId,
        status: 'failed',
      });
      throw error;
    }
  };
}
