import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { AppProviders } from '../app/providers.tsx';
import layersCssUrl from '../styles/layers.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ts-blueprint' },
    ],
    links: [{ rel: 'stylesheet', href: layersCssUrl }],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppProviders>
          <Outlet />
        </AppProviders>
        <Scripts />
      </body>
    </html>
  );
}
