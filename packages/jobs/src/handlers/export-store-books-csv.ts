import { createBooksRepository, createExportsRepository } from '@starter/db';
import type { JOB_NAMES, JobHandler } from '../types.ts';
import type { JobHandlersDeps } from './deps.ts';

function escapeCsvField(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export function createExportStoreBooksCsvHandler(
  deps: JobHandlersDeps,
): JobHandler<typeof JOB_NAMES.EXPORT_STORE_BOOKS_CSV> {
  return async (payload) => {
    const exportsRepo = createExportsRepository(deps.drizzleDb, payload.storeId);
    const booksRepo = createBooksRepository(deps.drizzleDb, payload.storeId);

    await exportsRepo.updateStatus({
      exportId: payload.exportId,
      status: 'processing',
    });

    try {
      const storeBooks = await booksRepo.listAllOrdered();

      const header = 'id,sku,title,author,priceCents,currency,stock,published';
      const rows = storeBooks.map((book) =>
        [
          escapeCsvField(book.id),
          escapeCsvField(book.sku),
          escapeCsvField(book.title),
          escapeCsvField(book.author),
          escapeCsvField(book.priceCents),
          escapeCsvField(book.currency),
          escapeCsvField(book.stock),
          escapeCsvField(book.published),
        ].join(','),
      );
      const csv = `${[header, ...rows].join('\n')}\n`;
      const fileKey = `stores/${payload.storeId}/exports/${payload.exportId}.csv`;

      await deps.storage.putObject({
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

      deps.logger.info(
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
