// @vitest-environment jsdom
import { updateOrderStatusSchema } from '@starter/contracts';
import type { Order } from '@starter/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { renderWithAppProviders } from '#/test/render.tsx';
import { MerchantOrdersTable } from './MerchantOrdersTable.tsx';
import { OrderTracker } from './OrderTracker.tsx';

const server = setupServer();

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: '00000000-0000-7000-8000-000000000042',
    storeId: 'store-1',
    customerId: 'cust-1',
    customerEmail: 'ada@example.com',
    customerName: 'Ada Lovelace',
    status: 'paid',
    totalCents: 7800,
    currency: 'USD',
    stripeCheckoutSessionId: null,
    items: [
      {
        id: '00000000-0000-7000-8000-000000000010',
        bookId: '00000000-0000-7000-8000-000000000001',
        title: 'DDIA',
        sku: 'SKU-1',
        quantity: 2,
        unitPriceCents: 3900,
      },
    ],
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

describe('Orders components', () => {
  test('MerchantOrdersTable fulfills paid orders and renders empty state', async () => {
    let orders: Array<Order> = [makeOrder({ status: 'paid' })];

    server.use(
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/orders', () =>
        HttpResponse.json({ orders }),
      ),
      http.patch(
        'http://127.0.0.1:3001/api/v1/stores/acme/orders/:orderId/status',
        async ({ request }) => {
          const body = updateOrderStatusSchema.parse(await request.json());
          orders = orders.map((o) => ({ ...o, status: body.status }));
          return HttpResponse.json(orders[0]);
        },
      ),
    );

    await renderWithAppProviders(<MerchantOrdersTable storeSlug="acme" />);

    expect(await screen.findByText('Ada Lovelace (ada@example.com)')).toBeTruthy();
    expect(screen.getByText('paid')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Fulfilled' }));
    expect(await screen.findByText('fulfilled')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark Fulfilled' })).toBeNull();

    orders = [];
    cleanup();
    await renderWithAppProviders(<MerchantOrdersTable storeSlug="acme" />);
    expect(await screen.findByText('No orders placed yet.')).toBeTruthy();
  });

  test('OrderTracker renders order summary and handles missing order', async () => {
    server.use(
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/orders/ord-42', () =>
        HttpResponse.json(makeOrder({ id: 'ord-42', status: 'fulfilled' })),
      ),
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/orders/missing', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );

    await renderWithAppProviders(<OrderTracker storeSlug="acme" orderId="ord-42" />);
    expect(await screen.findByText('Order ord-42')).toBeTruthy();
    expect(screen.getByText('DDIA × 2')).toBeTruthy();
    expect(screen.getByText('Total: $78.00')).toBeTruthy();
    expect(screen.getByText('fulfilled')).toBeTruthy();

    cleanup();
    await renderWithAppProviders(<OrderTracker storeSlug="acme" orderId="missing" />);
    expect(await screen.findByText('Order not found')).toBeTruthy();
  });
});
