import { Button, HStack, Text } from '@starter/ui';
import { Link } from '@tanstack/react-router';
import { isMultiTenancyEnabled } from '#/lib/env.ts';
import { useStores } from '../hooks/useStores.ts';

export function StoreSwitcher({ activeSlug }: { activeSlug?: string }) {
  const multiTenancyEnabled = isMultiTenancyEnabled();
  const { data } = useStores(multiTenancyEnabled);

  if (!multiTenancyEnabled || !data || data.stores.length === 0) {
    return null;
  }

  return (
    <HStack gap="xs" align="center">
      <Text color="secondary">Stores:</Text>
      {data.stores.map((store) => (
        <Link key={store.id} to="/dashboard/$storeSlug" params={{ storeSlug: store.slug }}>
          <Button
            label={store.name}
            variant={store.slug === activeSlug ? 'primary' : 'ghost'}
            size="sm"
          />
        </Link>
      ))}
    </HStack>
  );
}
