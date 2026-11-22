// @vitest-environment jsdom
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { BillingPanel } from './BillingPanel.tsx';

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

function renderBillingPanel() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme theme={neutralTheme}>
        <BillingPanel storeSlug="acme" />
      </Theme>
    </QueryClientProvider>,
  );
}

describe('BillingPanel component', () => {
  test('displays free plan usage and upgrades store to Pro', async () => {
    let plan: 'free' | 'pro' = 'free';

    server.use(
      http.get('http://127.0.0.1:3001/api/v1/stores/acme/billing', () =>
        HttpResponse.json({
          plan,
          status: plan === 'pro' ? 'active' : 'free',
          publishedBookCount: 25,
          bookLimit: plan === 'pro' ? null : 25,
          stripeCustomerId: 'cus_test_1',
          stripeSubscriptionId: plan === 'pro' ? 'sub_test_1' : null,
        }),
      ),
      http.post('http://127.0.0.1:3001/api/v1/stores/acme/billing/upgrade', () => {
        plan = 'pro';
        return HttpResponse.json({
          plan: 'pro',
          status: 'active',
          checkoutUrl: null,
        });
      }),
    );

    renderBillingPanel();

    expect(await screen.findByText('Catalog usage: 25 / 25 published books')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Pro' }));

    expect(await screen.findByText('Pro plan active')).toBeTruthy();
    expect(screen.getByText('Catalog usage: 25 published (Unlimited)')).toBeTruthy();
  });
});
