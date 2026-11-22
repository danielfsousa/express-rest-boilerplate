import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Link } from '@tanstack/react-router';
import { getApiBaseUrl } from '#/lib/env.ts';
import { formatCurrency } from '#/lib/format.ts';
import { useBook } from '../hooks/useBooks.ts';

export function BookDetail({ storeSlug, bookId }: { storeSlug: string; bookId: string }) {
  const { data: book, isLoading, error } = useBook(storeSlug, bookId);

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !book) {
    return <Banner status="error" title="Book not found" />;
  }

  return (
    <Card>
      <VStack gap="md">
        <HStack gap="lg" align="start">
          {book.coverUrl ? (
            <img
              src={`${getApiBaseUrl()}${book.coverUrl}`}
              alt={`${book.title} cover`}
              width={160}
              height={220}
            />
          ) : null}
          <VStack gap="sm">
            <Heading level={1}>{book.title}</Heading>
            <Text color="secondary">by {book.author}</Text>
            <Heading level={3}>{formatCurrency(book.priceCents, book.currency)}</Heading>
            <Text>{book.description || 'No description available.'}</Text>
            <Text color="secondary">
              {book.stock > 0 ? `${String(book.stock)} copies available` : 'Currently out of stock'}
            </Text>
          </VStack>
        </HStack>
        <Link to="/s/$storeSlug" params={{ storeSlug }}>
          <Button label="Back to catalog" variant="ghost" size="sm" />
        </Link>
      </VStack>
    </Card>
  );
}
