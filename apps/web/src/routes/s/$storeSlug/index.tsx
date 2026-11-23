import { Banner, Spinner } from '@starter/ui';
import { parseCatalogSearch } from '@starter/contracts';
import { createFileRoute } from '@tanstack/react-router';
import { StorefrontLayout } from '#/components/StorefrontLayout.tsx';
import { BookCatalog } from '#/features/books/index.ts';
import { useStore } from '#/features/stores/index.ts';

export const Route = createFileRoute('/s/$storeSlug/')({
  validateSearch: parseCatalogSearch,
  component: StorefrontPage,
});

function StorefrontPage() {
  const { storeSlug } = Route.useParams();
  const { q, offset } = Route.useSearch();
  const navigate = Route.useNavigate();
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
      <BookCatalog
        storeSlug={store.slug}
        search={q ?? ''}
        offset={offset ?? 0}
        onSearchChange={(nextSearch) => {
          void navigate({
            search: {
              q: nextSearch.length > 0 ? nextSearch : undefined,
              offset: undefined,
            },
            replace: true,
          });
        }}
        onOffsetChange={(nextOffset) => {
          void navigate({
            search: (prev) => ({
              ...prev,
              offset: nextOffset > 0 ? nextOffset : undefined,
            }),
          });
        }}
      />
    </StorefrontLayout>
  );
}
