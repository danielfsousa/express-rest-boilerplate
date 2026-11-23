// @vitest-environment jsdom
import type { StoreExport } from '@starter/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { renderWithAppProviders } from '#/test/render.tsx';
import { ExportsPanel } from './ExportsPanel.tsx';

const server = setupServer();

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

describe('ExportsPanel component', () => {
  test('renders empty state, queues CSV export, displays download link, and handles errors', async () => {
    let items: Array<StoreExport> = [];

    server.use(
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/exports', () =>
        HttpResponse.json({ items }),
      ),
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/exports/books', () => {
        const created: StoreExport = {
          id: '0195a8f0-0000-7000-8000-000000000001',
          storeId: 'store-1',
          requestedByUserId: 'user-1',
          status: 'completed',
          fileKey: 'exports/books.csv',
          downloadUrl: '/api/v1/stores/acme/exports/0195a8f0/download',
          createdAt: '2026-11-22T00:00:00.000Z',
          completedAt: '2026-11-22T00:00:01.000Z',
        };
        items = [created];
        return HttpResponse.json(created, { status: 201 });
      }),
    );

    await renderWithAppProviders(<ExportsPanel storeSlug="acme" />);

    expect(
      await screen.findByText('No exports yet. Click Export books CSV to generate one.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Export books CSV' }));
    expect(await screen.findByText('completed')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Download CSV' })).toBeTruthy();

    server.use(
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/exports/books', () =>
        HttpResponse.json({ error: 'Queue unavailable' }, { status: 500 }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export books CSV' }));
    expect(await screen.findByText('Queue unavailable')).toBeTruthy();
  });
});
