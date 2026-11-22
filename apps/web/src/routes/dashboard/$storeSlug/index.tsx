import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '#/components/AppLayout.tsx';
import { StoreSettingsForm, StoreSwitcher, useStore } from '#/features/stores/index.ts';
import { isBillingEnabled } from '#/lib/env.ts';

export const Route = createFileRoute('/dashboard/$storeSlug/')({
  component: MerchantDashboardPage,
});

function MerchantDashboardPage() {
  const { storeSlug } = Route.useParams();
  const { data: store, isLoading, error } = useStore(storeSlug);

  return (
    <AppLayout
      title={`Console: ${store?.name ?? storeSlug}`}
      headerActions={<StoreSwitcher activeSlug={storeSlug} />}
    >
      <HStack gap="sm">
        <Link to="/dashboard/$storeSlug/books" params={{ storeSlug }}>
          <Button label="Manage Books" variant="primary" size="sm" />
        </Link>
        <Link to="/dashboard/$storeSlug/orders" params={{ storeSlug }}>
          <Button label="Manage Orders" variant="secondary" size="sm" />
        </Link>
        {isBillingEnabled() ? (
          <Link to="/dashboard/$storeSlug/billing" params={{ storeSlug }}>
            <Button label="Billing" variant="secondary" size="sm" />
          </Link>
        ) : null}
        <Link to="/dashboard/$storeSlug/exports" params={{ storeSlug }}>
          <Button label="Exports" variant="secondary" size="sm" />
        </Link>
        <Link to="/s/$storeSlug" params={{ storeSlug }}>
          <Button label="View Storefront" variant="ghost" size="sm" />
        </Link>
      </HStack>
      {isLoading ? <Spinner /> : null}
      {error || !store ? (
        <Banner status="error" title="Store not found" />
      ) : (
        <StoreSettingsForm
          key={store.slug}
          storeSlug={store.slug}
          initialName={store.name}
          initialThreshold={store.lowStockThreshold}
        />
      )}
    </AppLayout>
  );
}
