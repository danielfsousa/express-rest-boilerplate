import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '#/components/AppLayout.tsx';
import { BookForm, MerchantBooksTable } from '#/features/books/index.ts';
import { StoreSwitcher } from '#/features/stores/index.ts';

export const Route = createFileRoute('/dashboard/$storeSlug/books')({
  component: MerchantBooksPage,
});

function MerchantBooksPage() {
  const { storeSlug } = Route.useParams();

  return (
    <AppLayout
      title={`Books: ${storeSlug}`}
      headerActions={<StoreSwitcher activeSlug={storeSlug} />}
    >
      <HStack gap="sm">
        <Link to="/dashboard/$storeSlug" params={{ storeSlug }}>
          <Button label="Store Settings" variant="ghost" size="sm" />
        </Link>
        <Link to="/dashboard/$storeSlug/orders" params={{ storeSlug }}>
          <Button label="Manage Orders" variant="ghost" size="sm" />
        </Link>
        <Link to="/s/$storeSlug" params={{ storeSlug }}>
          <Button label="View Storefront" variant="secondary" size="sm" />
        </Link>
      </HStack>
      <BookForm storeSlug={storeSlug} />
      <MerchantBooksTable storeSlug={storeSlug} />
    </AppLayout>
  );
}
