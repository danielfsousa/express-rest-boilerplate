import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
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
    <Card>
      <VStack gap="md">
        <Heading level={3}>Catalog ({String(data?.total ?? 0)})</Heading>
        {data?.books.length === 0 ? (
          <Text color="secondary">No books in this store yet.</Text>
        ) : null}
        {data?.books.map((book) => (
          <HStack key={book.id} justify="between" align="center" gap="md">
            <VStack gap="xs">
              <Text weight="semibold">
                {book.title} ({book.sku})
              </Text>
              <Text color="secondary">
                {book.author} · {formatCurrency(book.priceCents, book.currency)} · Stock:{' '}
                {String(book.stock)} · {book.published ? 'Published' : 'Draft'}
              </Text>
            </VStack>
            <HStack gap="sm" align="center">
              <CoverUpload storeSlug={storeSlug} bookId={book.id} />
              <Button
                label={book.published ? 'Unpublish' : 'Publish'}
                variant="secondary"
                size="sm"
                onClick={() => {
                  void updateBook.mutateAsync({
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
                  void deleteBook.mutateAsync(book.id);
                }}
              />
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Card>
  );
}
