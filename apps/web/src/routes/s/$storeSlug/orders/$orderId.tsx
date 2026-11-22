import { createFileRoute } from '@tanstack/react-router';
import { StorefrontLayout } from '../../../../components/StorefrontLayout.tsx';
import { OrderTracker } from '../../../../features/orders/index.ts';
import { useStore } from '../../../../features/stores/index.ts';

export const Route = createFileRoute('/s/$storeSlug/orders/$orderId')({
  component: StorefrontOrderPage,
});

function StorefrontOrderPage() {
  const { storeSlug, orderId } = Route.useParams();
  const { data: store } = useStore(storeSlug);

  return (
    <StorefrontLayout storeName={store?.name ?? storeSlug} storeSlug={storeSlug}>
      <OrderTracker storeSlug={storeSlug} orderId={orderId} />
    </StorefrontLayout>
  );
}
