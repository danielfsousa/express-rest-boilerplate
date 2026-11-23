import { Button, HStack } from '@starter/ui';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '#/components/AppLayout.tsx';
import { MerchantOrdersTable } from '#/features/orders/index.ts';
import { StoreSwitcher } from '#/features/stores/index.ts';

export const Route = createFileRoute('/dashboard/$storeSlug/orders')({
  component: MerchantOrdersPage,
});

function MerchantOrdersPage() {
  const { storeSlug } = Route.useParams();

  return (
    <AppLayout
      title={`Orders: ${storeSlug}`}
      headerActions={<StoreSwitcher activeSlug={storeSlug} />}
    >
      <HStack gap="sm">
        <Link to="/dashboard/$storeSlug" params={{ storeSlug }}>
          <Button label="Store Settings" variant="ghost" size="sm" />
        </Link>
        <Link to="/dashboard/$storeSlug/books" params={{ storeSlug }}>
          <Button label="Manage Books" variant="ghost" size="sm" />
        </Link>
        <Link to="/s/$storeSlug" params={{ storeSlug }}>
          <Button label="View Storefront" variant="secondary" size="sm" />
        </Link>
      </HStack>
      <MerchantOrdersTable storeSlug={storeSlug} />
    </AppLayout>
  );
}
