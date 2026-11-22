// @vitest-environment jsdom
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';
import { adminUpdateStorePlanSchema, adminUpdateUserSchema } from '@starter/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { AdminDashboard } from './AdminDashboard.tsx';

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

function renderAdminDashboard(onImpersonated?: (userId: string) => void) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme theme={neutralTheme}>
        <AdminDashboard onImpersonated={onImpersonated} />
      </Theme>
    </QueryClientProvider>,
  );
}

describe('AdminDashboard component', () => {
  test('renders tenant stores, overrides store billing plan, bans users, and impersonates a merchant', async () => {
    let storePlan: 'free' | 'pro' = 'free';
    let userBanned = false;
    let impersonatedId = '';

    server.use(
      http.get('http://127.0.0.1:3001/api/v1/admin/overview', () =>
        HttpResponse.json({
          totalStores: 1,
          activeProStores: storePlan === 'pro' ? 1 : 0,
          totalUsers: 1,
          totalOrders: 3,
          totalRevenueCents: 5400,
          stores: [
            {
              id: 'store-1',
              slug: 'acme-books',
              name: 'Acme Books',
              plan: storePlan,
              subscriptionStatus: 'active',
              memberCount: 2,
              publishedBookCount: 12,
              orderCount: 3,
              revenueCents: 5400,
              createdAt: '2026-11-22T00:00:00.000Z',
            },
          ],
          users: [
            {
              id: 'user-merchant-1',
              name: 'Alice Merchant',
              email: 'alice@acme.test',
              role: 'user',
              banned: userBanned,
              banReason: userBanned ? 'Suspended by platform administrator' : null,
              storeCount: 1,
              createdAt: '2026-11-22T00:00:00.000Z',
            },
          ],
        }),
      ),
      http.patch(
        'http://127.0.0.1:3001/api/v1/admin/stores/acme-books/plan',
        async ({ request }) => {
          const body = adminUpdateStorePlanSchema.parse(await request.json());
          storePlan = body.plan;
          return HttpResponse.json({
            id: 'store-1',
            slug: 'acme-books',
            name: 'Acme Books',
            plan: storePlan,
            subscriptionStatus: 'active',
            memberCount: 2,
            publishedBookCount: 12,
            orderCount: 3,
            revenueCents: 5400,
            createdAt: '2026-11-22T00:00:00.000Z',
          });
        },
      ),
      http.patch(
        'http://127.0.0.1:3001/api/v1/admin/users/user-merchant-1',
        async ({ request }) => {
          const body = adminUpdateUserSchema.parse(await request.json());
          if (typeof body.banned === 'boolean') {
            userBanned = body.banned;
          }
          return HttpResponse.json({
            id: 'user-merchant-1',
            name: 'Alice Merchant',
            email: 'alice@acme.test',
            role: 'user',
            banned: userBanned,
            banReason: userBanned ? 'Suspended by platform administrator' : null,
            storeCount: 1,
            createdAt: '2026-11-22T00:00:00.000Z',
          });
        },
      ),
      http.post('http://127.0.0.1:3001/api/auth/admin/impersonate-user', () =>
        HttpResponse.json({
          session: {
            id: 'sess-imp-1',
            userId: 'user-merchant-1',
            impersonatedBy: 'admin-1',
          },
          user: {
            id: 'user-merchant-1',
            email: 'alice@acme.test',
            name: 'Alice Merchant',
          },
        }),
      ),
      http.get('http://127.0.0.1:3001/api/auth/get-session', () =>
        HttpResponse.json({
          session: {
            id: 'sess-imp-1',
            userId: 'user-merchant-1',
            impersonatedBy: 'admin-1',
          },
          user: {
            id: 'user-merchant-1',
            email: 'alice@acme.test',
            name: 'Alice Merchant',
          },
        }),
      ),
    );

    renderAdminDashboard((uid) => {
      impersonatedId = uid;
    });

    expect(await screen.findByText('Acme Books')).toBeTruthy();
    expect(screen.getByText('$54.00')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Grant Pro' }));
    expect(await screen.findByRole('button', { name: 'Downgrade to Free' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Impersonate Alice Merchant' }));
    expect(await screen.findByText('Now impersonating alice@acme.test')).toBeTruthy();
    expect(impersonatedId).toBe('user-merchant-1');

    fireEvent.click(screen.getByRole('button', { name: 'Ban user' }));
    expect(await screen.findByRole('button', { name: 'Unban user' })).toBeTruthy();
  });
});
