import {
  Banner,
  Button,
  Card,
  Heading,
  HStack,
  Spinner,
  Text,
  TextInput,
  VStack,
} from '@starter/ui';
import { Link } from '@tanstack/react-router';
import { useReducer } from 'react';
import { getApiBaseUrl } from '#/lib/env.ts';
import { formatCurrency } from '#/lib/format.ts';
import { useBooks } from '../hooks/useBooks.ts';

interface CatalogLocalState {
  search: string;
  offset: number;
}

type CatalogAction = { type: 'setSearch'; value: string } | { type: 'setOffset'; value: number };

function catalogReducer(state: CatalogLocalState, action: CatalogAction): CatalogLocalState {
  switch (action.type) {
    case 'setSearch':
      return { search: action.value, offset: 0 };
    case 'setOffset':
      return { ...state, offset: Math.max(0, action.value) };
  }
}

export interface BookCatalogProps {
  storeSlug: string;
  search?: string;
  offset?: number;
  onSearchChange?: (nextSearch: string) => void;
  onOffsetChange?: (nextOffset: number) => void;
}

export function BookCatalog({
  storeSlug,
  search: controlledSearch,
  offset: controlledOffset,
  onSearchChange,
  onOffsetChange,
}: BookCatalogProps) {
  const [localState, dispatch] = useReducer(catalogReducer, { search: '', offset: 0 });
  const search = controlledSearch ?? localState.search;
  const offset = controlledOffset ?? localState.offset;
  const limit = 20;

  const { data, isLoading, error } = useBooks(storeSlug, {
    q: search.trim() || undefined,
    published: 'true',
    limit,
    offset,
  });

  function handleSearchChange(value: string) {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }
    dispatch({ type: 'setSearch', value });
  }

  function handleOffsetChange(nextOffset: number) {
    const safeOffset = Math.max(0, nextOffset);
    if (onOffsetChange) {
      onOffsetChange(safeOffset);
      return;
    }
    dispatch({ type: 'setOffset', value: safeOffset });
  }

  return (
    <VStack gap={4}>
      <TextInput
        type="search"
        label="Search books"
        placeholder="Search by title, author, or SKU"
        value={search}
        onChange={handleSearchChange}
        hasClear
      />

      {isLoading ? <Spinner /> : null}
      {error ? (
        <Banner status="error" title="Could not load books" description={error.message} />
      ) : null}

      {data && data.books.length === 0 ? (
        <Card>
          <Text color="secondary">No published books found.</Text>
        </Card>
      ) : null}

      {data?.books.map((book) => (
        <Card key={book.id}>
          <HStack justify="between" align="center" gap={4}>
            <HStack align="center" gap={4}>
              {book.coverUrl ? (
                <img
                  src={`${getApiBaseUrl()}${book.coverUrl}`}
                  alt={`${book.title} cover`}
                  width={56}
                  height={76}
                />
              ) : null}
              <VStack gap={1}>
                <Heading level={3}>{book.title}</Heading>
                <Text color="secondary">{book.author}</Text>
                <Text>
                  {formatCurrency(book.priceCents, book.currency)} ·{' '}
                  {book.stock > 0 ? `${String(book.stock)} in stock` : 'Out of stock'}
                </Text>
              </VStack>
            </HStack>
            <Link to="/s/$storeSlug/books/$bookId" params={{ storeSlug, bookId: book.id }}>
              <Button label="View book" variant="primary" size="sm" />
            </Link>
          </HStack>
        </Card>
      ))}

      {data && data.total > limit ? (
        <HStack justify="between" align="center">
          <Button
            label="Previous"
            variant="secondary"
            size="sm"
            isDisabled={offset === 0}
            onClick={() => {
              handleOffsetChange(offset - limit);
            }}
          />
          <Text color="secondary">
            Showing {String(offset + 1)}-{String(Math.min(offset + limit, data.total))} of{' '}
            {String(data.total)}
          </Text>
          <Button
            label="Next"
            variant="secondary"
            size="sm"
            isDisabled={offset + limit >= data.total}
            onClick={() => {
              handleOffsetChange(offset + limit);
            }}
          />
        </HStack>
      ) : null}
    </VStack>
  );
}
