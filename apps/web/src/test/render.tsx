import { StarterThemeProvider } from '@starter/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LocaleProvider } from '../features/i18n/index.ts';

export interface RenderWithProvidersOptions {
  initialPath?: string;
}

export async function renderWithAppProviders(ui: ReactNode, options?: RenderWithProvidersOptions) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => ui,
  });

  const catchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '$',
    component: () => ui,
  });

  const routeTree = rootRoute.addChildren([testRoute, catchAllRoute]);
  const history = createMemoryHistory({
    initialEntries: [options?.initialPath ?? '/'],
  });
  const router = createRouter({
    routeTree,
    history,
  });

  await router.load();

  const view = render(
    <QueryClientProvider client={queryClient}>
      <StarterThemeProvider>
        <LocaleProvider>
          <RouterProvider router={router} />
        </LocaleProvider>
      </StarterThemeProvider>
    </QueryClientProvider>,
  );

  return { ...view, router, queryClient };
}
