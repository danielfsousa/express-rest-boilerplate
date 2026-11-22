// @vitest-environment jsdom
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vite-plus/test';
import { BookCatalog } from './BookCatalog.tsx';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const sampleBooks = [
  {
    id: '00000000-0000-7000-8000-000000000001',
    storeId: 'store-1',
    sku: 'BK-1',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    description: 'Distributed systems',
    priceCents: 4500,
    currency: 'USD',
    stock: 8,
    coverKey: null,
    coverUrl: null,
    published: true,
    createdAt: '2026-11-22T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
  {
    id: '00000000-0000-7000-8000-000000000002',
    storeId: 'store-1',
    sku: 'BK-2',
    title: 'Domain-Driven Design',
    author: 'Eric Evans',
    description: 'Software modeling',
    priceCents: 3800,
    currency: 'USD',
    stock: 3,
    coverKey: null,
    coverUrl: null,
    published: true,
    createdAt: '2026-11-22T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
];

const server = setupServer(
  http.get('http://127.0.0.1:3001/api/v1/stores/acme/books', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const filtered = q
      ? sampleBooks.filter((book) => book.title.toLowerCase().includes(q))
      : sampleBooks;
    return HttpResponse.json({
      books: filtered,
      total: filtered.length,
      limit: 20,
      offset: 0,
    });
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function renderCatalog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme theme={neutralTheme}>
        <BookCatalog storeSlug="acme" />
      </Theme>
    </QueryClientProvider>,
  );
}

describe('BookCatalog component', () => {
  test('renders published books and filters by search input', async () => {
    renderCatalog();

    expect(await screen.findByText('Designing Data-Intensive Applications')).toBeTruthy();
    expect(await screen.findByText('Domain-Driven Design')).toBeTruthy();

    const searchInput = screen.getByRole('searchbox', {
      name: /search books/i,
    });
    fireEvent.change(searchInput, { target: { value: 'Domain' } });

    await waitFor(() => {
      expect(screen.queryByText('Designing Data-Intensive Applications')).toBeNull();
    });
    expect(await screen.findByText('Domain-Driven Design')).toBeTruthy();
  });
});
