// @vitest-environment jsdom
import { createBookSchema, updateBookSchema } from '@starter/contracts';
import type { Book, CreateBookInput } from '@starter/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { renderWithAppProviders } from '#/test/render.tsx';
import { BookDetail } from './BookDetail.tsx';
import { BookForm } from './BookForm.tsx';
import { MerchantBooksTable } from './MerchantBooksTable.tsx';

const server = setupServer();

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: '00000000-0000-7000-8000-000000000001',
    storeId: 'store-1',
    sku: 'SKU-DDIA',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    description: 'Distributed systems',
    priceCents: 3900,
    currency: 'USD',
    stock: 10,
    coverKey: null,
    coverUrl: null,
    published: true,
    createdAt: '2026-11-22T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z',
    ...overrides,
  };
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('Books components', () => {
  test('BookForm parses dollars and stock, submits book, resets, and displays errors', async () => {
    let submitted: CreateBookInput | null = null;
    server.use(
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/books', async ({ request }) => {
        submitted = createBookSchema.parse(await request.json());
        return HttpResponse.json(
          makeBook({
            sku: submitted.sku,
            title: submitted.title,
            author: submitted.author,
            priceCents: submitted.priceCents,
            stock: submitted.stock ?? 0,
            published: submitted.published ?? false,
          }),
          { status: 201 },
        );
      }),
    );

    await renderWithAppProviders(<BookForm storeSlug="acme" />);

    fireEvent.change(screen.getByLabelText(/SKU/i), { target: { value: 'SKU-NEW' } });
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Clean Architecture' } });
    fireEvent.change(screen.getByLabelText(/Author/i), { target: { value: 'Robert Martin' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '24.50' } });
    fireEvent.change(screen.getByLabelText(/Stock/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add book' }));

    await waitFor(() => {
      expect(submitted).toEqual({
        sku: 'SKU-NEW',
        title: 'Clean Architecture',
        author: 'Robert Martin',
        description: '',
        priceCents: 2450,
        currency: 'USD',
        stock: 12,
        published: true,
      });
    });

    server.use(
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/books', () =>
        HttpResponse.json({ error: 'Free plan limit reached' }, { status: 402 }),
      ),
    );

    fireEvent.change(screen.getByLabelText(/SKU/i), { target: { value: 'SKU-26' } });
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Book 26' } });
    fireEvent.change(screen.getByLabelText(/Author/i), { target: { value: 'Author' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add book' }));

    expect(await screen.findByText('Free plan limit reached')).toBeTruthy();
  });

  test('BookDetail renders cover, stock, out-of-stock state, and error state', async () => {
    server.use(
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/books/book-1', () =>
        HttpResponse.json(makeBook({ coverUrl: '/covers/ddia.png', stock: 4 })),
      ),
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/books/book-empty', () =>
        HttpResponse.json(makeBook({ id: 'book-empty', description: '', stock: 0 })),
      ),
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/books/missing', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );

    await renderWithAppProviders(<BookDetail storeSlug="acme" bookId="book-1" />);
    expect(await screen.findByText('Designing Data-Intensive Applications')).toBeTruthy();
    expect(screen.getByText('4 copies available')).toBeTruthy();
    expect(screen.getByAltText('Designing Data-Intensive Applications cover')).toBeTruthy();

    cleanup();
    await renderWithAppProviders(<BookDetail storeSlug="acme" bookId="book-empty" />);
    expect(await screen.findByText('Currently out of stock')).toBeTruthy();
    expect(screen.getByText('No description available.')).toBeTruthy();

    cleanup();
    await renderWithAppProviders(<BookDetail storeSlug="acme" bookId="missing" />);
    expect(await screen.findByText('Book not found')).toBeTruthy();
  });

  test('MerchantBooksTable toggles publish, uploads cover, deletes book, and shows empty state', async () => {
    let books: Array<Book> = [makeBook()];
    let uploadedCover = false;

    server.use(
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/books', () =>
        HttpResponse.json({ books, total: books.length, limit: 100, offset: 0 }),
      ),
      http.patch('http://127.0.0.1:3001/api/v1/stores/acme/books/:bookId', async ({ request }) => {
        const body = updateBookSchema.parse(await request.json());
        books = books.map((b) => ({ ...b, published: body.published ?? b.published }));
        return HttpResponse.json(books[0]);
      }),
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/books/:bookId/cover', () => {
        uploadedCover = true;
        return HttpResponse.json({ coverKey: 'covers/1.png', coverUrl: '/covers/1.png' });
      }),
      http.delete('http://127.0.0.1:3001/api/v1/stores/acme/books/:bookId', () => {
        books = [];
        return HttpResponse.json({ deleted: true });
      }),
    );

    await renderWithAppProviders(<MerchantBooksTable storeSlug="acme" />);

    expect(
      await screen.findByText('Designing Data-Intensive Applications (SKU-DDIA)'),
    ).toBeTruthy();
    expect(screen.getByText('Published')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }));
    expect(await screen.findByText('Draft')).toBeTruthy();

    const fileInput = screen.getByLabelText(/Upload cover/i);
    const file = new File(['png-bytes'], 'cover.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(uploadedCover).toBe(true);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('No books in this store yet.')).toBeTruthy();
  });
});
