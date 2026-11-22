import { Banner } from '@astryxdesign/core/Banner';
import { Spinner } from '@astryxdesign/core/Spinner';
import { createFileRoute } from '@tanstack/react-router';
import { StorefrontLayout } from '../../../components/StorefrontLayout.tsx';
import { BookCatalog } from '../../../features/books/index.ts';
import { useStore } from '../../../features/stores/index.ts';

export const Route = createFileRoute('/s/$storeSlug/')({
  component: StorefrontPage,
});

function StorefrontPage() {
  const { storeSlug } = Route.useParams();
  const { data: store, isLoading, error } = useStore(storeSlug);

  if (isLoading) {
    return (
      <StorefrontLayout storeName={storeSlug} storeSlug={storeSlug}>
        <Spinner />
      </StorefrontLayout>
    );
  }

  if (error || !store) {
    return (
      <StorefrontLayout storeName={storeSlug} storeSlug={storeSlug}>
        <Banner status="error" title="Store not found" />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store.name} storeSlug={store.slug}>
      <BookCatalog storeSlug={store.slug} />
    </StorefrontLayout>
  );
}
