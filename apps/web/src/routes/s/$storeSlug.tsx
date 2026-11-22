import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { createFileRoute } from '@tanstack/react-router';
import { StorefrontLayout } from '../../components/StorefrontLayout.tsx';
import { useStore } from '../../features/stores/index.ts';

export const Route = createFileRoute('/s/$storeSlug')({
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
      <Card>
        <VStack gap="sm">
          <Heading level={2}>Welcome to {store.name}</Heading>
          <Text color="secondary">Storefront catalog and checkout will appear here.</Text>
        </VStack>
      </Card>
    </StorefrontLayout>
  );
}
