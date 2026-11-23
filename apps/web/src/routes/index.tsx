import { Button, Heading, HStack, SectionCard, Text } from '@starter/ui';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '../components/AppLayout.tsx';
import { useSession } from '../features/auth/index.ts';
import { CreateStoreForm, StoreSwitcher } from '../features/stores/index.ts';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data: session } = useSession();

  return (
    <AppLayout headerActions={<StoreSwitcher />}>
      <SectionCard>
        <Heading level={1}>Multi-tenant Bookstore Starter</Heading>
        <Text color="secondary">
          Build storefronts and merchant consoles with Hono, Drizzle ORM 1.0, PostgreSQL Row-Level
          Security, TanStack Start, and Meta Astryx.
        </Text>
        <HStack gap={2}>
          <Link to="/s/$storeSlug" params={{ storeSlug: 'default' }}>
            <Button label="Browse Default Storefront" variant="secondary" />
          </Link>
          {session?.user ? (
            <Link to="/dashboard/$storeSlug" params={{ storeSlug: 'default' }}>
              <Button label="Open Merchant Console" variant="primary" />
            </Link>
          ) : null}
        </HStack>
      </SectionCard>
      {session?.user ? <CreateStoreForm /> : null}
    </AppLayout>
  );
}
