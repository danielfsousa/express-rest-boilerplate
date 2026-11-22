// @vitest-environment jsdom
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vite-plus/test';
import { CheckoutForm } from './CheckoutForm.tsx';

const navigateSpy = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateSpy,
}));

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  navigateSpy.mockReset();
});

afterAll(() => {
  server.close();
});

function renderCheckout() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme theme={neutralTheme}>
        <CheckoutForm storeSlug="acme" bookId="00000000-0000-7000-8000-000000000001" />
      </Theme>
    </QueryClientProvider>,
  );
}

describe('CheckoutForm component', () => {
  test('submits order and navigates to order tracker', async () => {
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
                id: 'item-1',
                bookId: '00000000-0000-7000-8000-000000000001',
                title: 'Data Systems',
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

    renderCheckout();

    fireEvent.change(screen.getByRole('textbox', { name: /your name/i }), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await vi.waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith({
        to: '/s/$storeSlug/orders/$orderId',
        params: {
          storeSlug: 'acme',
          orderId: '00000000-0000-7000-8000-000000000099',
        },
      });
    });
  });

  test('displays error banner when API rejects oversell with 409', async () => {
    server.use(
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/orders', () =>
        HttpResponse.json({ error: 'Insufficient stock for "Data Systems"' }, { status: 409 }),
      ),
    );

    renderCheckout();

    fireEvent.change(screen.getByRole('textbox', { name: /your name/i }), {
      target: { value: 'Ada' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByText('Insufficient stock for "Data Systems"')).toBeTruthy();
  });
});
