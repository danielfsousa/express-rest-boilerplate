// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { renderWithAppProviders } from '#/test/render.tsx';
import { CheckoutForm } from './CheckoutForm.tsx';

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

describe('CheckoutForm component', () => {
  test('submits order and navigates to order tracker via real memory router', async () => {
    server.use(
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/orders', () =>
        HttpResponse.json(
          {
            id: '00000000-0000-7000-8000-000000000099',
            storeId: 'store-1',
            customerId: 'cust-1',
            customerEmail: 'ada@example.com',
            customerName: 'Ada Lovelace',
            status: 'paid',
            totalCents: 4500,
            currency: 'USD',
            stripeCheckoutSessionId: null,
            items: [
              {
                id: '00000000-0000-7000-8000-000000000010',
                bookId: '00000000-0000-7000-8000-000000000001',
                title: 'DDIA',
                sku: 'BK-1',
                quantity: 1,
                unitPriceCents: 4500,
              },
            ],
            createdAt: '2026-11-22T00:00:00.000Z',
            updatedAt: '2026-11-22T00:00:00.000Z',
          },
          { status: 201 },
        ),
      ),
    );

    const { router } = await renderWithAppProviders(
      <CheckoutForm storeSlug="acme" bookId="00000000-0000-7000-8000-000000000001" />,
    );

    fireEvent.change(screen.getByLabelText(/Your name/i), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Place order' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        '/s/acme/orders/00000000-0000-7000-8000-000000000099',
      );
    });
  });

  test('displays error banner when store rejects order due to insufficient stock', async () => {
    server.use(
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/orders', () =>
        HttpResponse.json({ error: 'Insufficient stock for "DDIA"' }, { status: 409 }),
      ),
    );

    await renderWithAppProviders(
      <CheckoutForm storeSlug="acme" bookId="00000000-0000-7000-8000-000000000001" />,
    );

    fireEvent.change(screen.getByLabelText(/Your name/i), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Place order' }));

    expect(await screen.findByText('Insufficient stock for "DDIA"')).toBeTruthy();
  });
});
