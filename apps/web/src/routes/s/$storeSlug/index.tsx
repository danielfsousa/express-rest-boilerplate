import { Banner } from '@astryxdesign/core/Banner';
import { Spinner } from '@astryxdesign/core/Spinner';
import { createFileRoute } from '@tanstack/react-router';
import { StorefrontLayout } from '#/components/StorefrontLayout.tsx';
import { BookCatalog } from '#/features/books/index.ts';
import { useStore } from '#/features/stores/index.ts';

interface CatalogSearchParams {
  q?: string | undefined;
  offset?: number | undefined;
}

function validateCatalogSearch(search: { q?: unknown; offset?: unknown }): CatalogSearchParams {
  const q = typeof search.q === 'string' && search.q.length > 0 ? search.q : undefined;
  const rawOffset = search.offset;
  const parsedOffset =
    typeof rawOffset === 'number'
      ? rawOffset
      : typeof rawOffset === 'string'
        ? Number.parseInt(rawOffset, 10)
        : Number.NaN;
  const offset = Number.isInteger(parsedOffset) && parsedOffset > 0 ? parsedOffset : undefined;
  return { q, offset };
}

export const Route = createFileRoute('/s/$storeSlug/')({
  validateSearch: validateCatalogSearch,
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
