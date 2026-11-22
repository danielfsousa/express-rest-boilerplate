import { Banner } from '@astryxdesign/core/Banner';
import { Spinner } from '@astryxdesign/core/Spinner';
import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '../../components/AppLayout.tsx';
import { StoreSettingsForm, StoreSwitcher, useStore } from '../../features/stores/index.ts';

export const Route = createFileRoute('/dashboard/$storeSlug')({
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
      {isLoading ? <Spinner /> : null}
      {error || !store ? (
        <Banner status="error" title="Store not found" />
      ) : (
        <StoreSettingsForm
          storeSlug={store.slug}
          initialName={store.name}
          initialThreshold={store.lowStockThreshold}
        />
      )}
    </AppLayout>
  );
}
