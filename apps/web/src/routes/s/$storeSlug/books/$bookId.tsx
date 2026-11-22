import { createFileRoute } from '@tanstack/react-router';
import { StorefrontLayout } from '#/components/StorefrontLayout.tsx';
import { BookDetail } from '#/features/books/index.ts';
import { CheckoutForm } from '#/features/orders/index.ts';
import { useStore } from '#/features/stores/index.ts';

export const Route = createFileRoute('/s/$storeSlug/books/$bookId')({
  component: StorefrontBookDetailPage,
});

function StorefrontBookDetailPage() {
  const { storeSlug, bookId } = Route.useParams();
  const { data: store } = useStore(storeSlug);

  return (
    <StorefrontLayout storeName={store?.name ?? storeSlug} storeSlug={storeSlug}>
      <BookDetail storeSlug={storeSlug} bookId={bookId} />
      <CheckoutForm storeSlug={storeSlug} bookId={bookId} />
    </StorefrontLayout>
  );
}
