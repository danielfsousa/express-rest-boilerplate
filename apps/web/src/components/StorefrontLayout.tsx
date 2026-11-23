import { Button, Heading, PageShell } from '@starter/ui';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { LocaleSwitcher } from '../features/i18n/index.ts';

export interface StorefrontLayoutProps {
  storeName: string;
  storeSlug: string;
  children: ReactNode;
}

export function StorefrontLayout({ storeName, storeSlug, children }: StorefrontLayoutProps) {
  return (
    <PageShell
      title={<Heading level={1}>{storeName}</Heading>}
      subtitle={`Storefront /${storeSlug}`}
      actions={
        <>
          <LocaleSwitcher />
          <Link to="/dashboard/$storeSlug" params={{ storeSlug }}>
            <Button label="Merchant Console" variant="secondary" size="sm" />
          </Link>
          <Link to="/">
            <Button label="All Stores" variant="ghost" size="sm" />
          </Link>
        </>
      }
    >
      {children}
    </PageShell>
  );
}
