// @vitest-environment jsdom
import { createStoreSchema, updateStoreSchema } from '@starter/contracts';
import type { Store, UpdateStoreInput } from '@starter/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { renderWithAppProviders } from '#/test/render.tsx';
import { CreateStoreForm } from './CreateStoreForm.tsx';
import { StoreSettingsForm } from './StoreSettingsForm.tsx';
import { StoreSwitcher } from './StoreSwitcher.tsx';

const server = setupServer();

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    id: 'store-1',
    slug: 'acme-books',
    name: 'Acme Books',
    logo: null,
    lowStockThreshold: 5,
    role: 'owner',
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

describe('Stores components', () => {
  test('CreateStoreForm creates store, navigates to dashboard, and shows errors', async () => {
    server.use(
      http.post('http://127.0.0.1:3001/api/v1/stores', async ({ request }) => {
        const body = createStoreSchema.parse(await request.json());
        return HttpResponse.json(makeStore({ name: body.name, slug: body.slug }), { status: 201 });
      }),
    );

    const { router } = await renderWithAppProviders(<CreateStoreForm />);

    fireEvent.change(screen.getByLabelText(/Store name/i), { target: { value: 'Acme Books' } });
    fireEvent.change(screen.getByLabelText(/Store slug/i), { target: { value: 'acme-books' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create store' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard/acme-books');
    });

    server.use(
      http.post('http://127.0.0.1:3001/api/v1/stores', () =>
        HttpResponse.json({ error: 'Slug already taken' }, { status: 409 }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create store' }));
    expect(await screen.findByText('Slug already taken')).toBeTruthy();
  });

  test('StoreSettingsForm updates store settings and falls back on non-numeric threshold', async () => {
    let lastUpdate: UpdateStoreInput | null = null;
    server.use(
      http.patch('http://127.0.0.1:3001/api/v1/stores/acme', async ({ request }) => {
        lastUpdate = updateStoreSchema.parse(await request.json());
        return HttpResponse.json(
          makeStore({
            slug: 'acme',
            name: lastUpdate.name ?? 'Acme',
            lowStockThreshold: lastUpdate.lowStockThreshold ?? 5,
          }),
        );
      }),
    );

    await renderWithAppProviders(
      <StoreSettingsForm storeSlug="acme" initialName="Acme" initialThreshold={5} />,
    );

    fireEvent.change(screen.getByLabelText(/Store name/i), { target: { value: 'Acme Updated' } });
    fireEvent.change(screen.getByLabelText(/Low stock threshold/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(await screen.findByText('Store settings saved')).toBeTruthy();
    expect(lastUpdate).toEqual({ name: 'Acme Updated', lowStockThreshold: 12 });

    fireEvent.change(screen.getByLabelText(/Low stock threshold/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(lastUpdate).toEqual({ name: 'Acme Updated', lowStockThreshold: 5 });
    });

    server.use(
      http.patch('http://127.0.0.1:3001/api/v1/stores/acme', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Forbidden')).toBeTruthy();
  });

  test('StoreSwitcher renders store buttons when stores exist', async () => {
    server.use(
      http.get('http://127.0.0.1:3001/api/v1/stores', () =>
        HttpResponse.json({
          stores: [
            makeStore({ id: 's1', slug: 'acme', name: 'Acme' }),
            makeStore({ id: 's2', slug: 'beta', name: 'Beta Books' }),
          ],
        }),
      ),
    );

    await renderWithAppProviders(<StoreSwitcher activeSlug="acme" />);
    expect(await screen.findByRole('button', { name: 'Acme' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Beta Books' })).toBeTruthy();
  });
});
