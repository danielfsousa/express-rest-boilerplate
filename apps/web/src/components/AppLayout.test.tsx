// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { authClient } from '#/lib/auth-client.ts';
import { renderWithAppProviders } from '#/test/render.tsx';
import { AppLayout } from './AppLayout.tsx';

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  const sessionAtom = authClient.$store.atoms.session;
  if (sessionAtom) {
    sessionAtom.set({ ...sessionAtom.get(), data: null, error: null, isPending: true });
  }
});

afterAll(() => {
  server.close();
});

describe('AppLayout component', () => {
  test('renders unauthenticated header without admin button or impersonation banner', async () => {
    server.use(
      http.get('http://127.0.0.1:3001/api/auth/get-session', () => HttpResponse.json(null)),
    );
    authClient.$store.notify('$sessionSignal');

    await renderWithAppProviders(
      <AppLayout title="Bookstore Console">
        <div>Body content</div>
      </AppLayout>,
    );

    expect(await screen.findByText('Bookstore Console')).toBeTruthy();
    expect(screen.getByText('Body content')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'SaaS Admin' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Stop impersonating' })).toBeNull();
  });

  test('renders SaaS Admin link for admin users', async () => {
    server.use(
      http.get('http://127.0.0.1:3001/api/auth/get-session', () =>
        HttpResponse.json({
          session: { id: 'sess-1', userId: 'admin-1' },
          user: { id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
        }),
      ),
    );
    authClient.$store.notify('$sessionSignal');

    await renderWithAppProviders(
      <AppLayout>
        <div>Admin view</div>
      </AppLayout>,
    );

    expect(await screen.findByRole('button', { name: 'SaaS Admin' })).toBeTruthy();
  });

  test('renders impersonation banner when session has impersonatedBy', async () => {
    server.use(
      http.get('http://127.0.0.1:3001/api/auth/get-session', () =>
        HttpResponse.json({
          session: { id: 'sess-imp', userId: 'user-1', impersonatedBy: 'admin-1' },
          user: { id: 'user-1', email: 'merchant@acme.test', name: 'Merchant', role: 'user' },
        }),
      ),
    );
    authClient.$store.notify('$sessionSignal');

    await renderWithAppProviders(
      <AppLayout>
        <div>Merchant view</div>
      </AppLayout>,
    );

    expect(await screen.findByText('Impersonating merchant@acme.test')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'SaaS Admin' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByRole('button', { name: 'Stop impersonating' })).toBeTruthy();
  });
});
