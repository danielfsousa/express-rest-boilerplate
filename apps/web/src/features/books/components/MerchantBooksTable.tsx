import {
  Banner,
  Button,
  DataRow,
  EmptyNotice,
  SectionCard,
  Spinner,
  StatusPill,
} from '@starter/ui';
import { formatCurrency } from '#/lib/format.ts';
import { useBooks, useDeleteBook, useUpdateBook } from '../hooks/useBooks.ts';
import { CoverUpload } from './CoverUpload.tsx';

export function MerchantBooksTable({ storeSlug }: { storeSlug: string }) {
  const { data, isLoading, error } = useBooks(storeSlug, { limit: 100 });
  const updateBook = useUpdateBook(storeSlug);
  const deleteBook = useDeleteBook(storeSlug);

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <Banner status="error" title="Could not load catalog" description={error.message} />;
  }

  return (
    <SectionCard title={`Catalog (${String(data?.total ?? 0)})`}>
      {data?.books.length === 0 ? (
        <EmptyNotice title="No books in this store yet." isCompact />
      ) : null}
      {data?.books.map((book) => (
        <DataRow
          key={book.id}
          title={`${book.title} (${book.sku})`}
          subtitle={`${book.author} · ${formatCurrency(book.priceCents, book.currency)} · Stock: ${String(book.stock)}`}
          status={
            <StatusPill
              tone={book.published ? 'success' : 'neutral'}
              label={book.published ? 'Published' : 'Draft'}
            />
          }
          actions={
            <>
              <CoverUpload storeSlug={storeSlug} bookId={book.id} />
              <Button
                label={book.published ? 'Unpublish' : 'Publish'}
                variant="secondary"
                size="sm"
                onClick={() => {
                  updateBook.mutate({
                    bookId: book.id,
                    input: { published: !book.published },
                  });
                }}
              />
              <Button
                label="Delete"
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteBook.mutate(book.id);
                }}
              />
            </>
          }
        />
      ))}
    </SectionCard>
  );
}
