import { StarterThemeProvider } from '@starter/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { LocaleProvider } from '../features/i18n/index.ts';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StarterThemeProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </StarterThemeProvider>
    </QueryClientProvider>
  );
}
