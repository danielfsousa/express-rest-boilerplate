import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

export interface StorefrontLayoutProps {
  storeName: string;
  storeSlug: string;
  children: ReactNode;
}

export function StorefrontLayout({ storeName, storeSlug, children }: StorefrontLayoutProps) {
  return (
    <VStack gap="lg" padding="lg">
      <HStack justify="between" align="center" gap="md">
        <VStack gap="xs">
          <Heading level={1}>{storeName}</Heading>
          <Text color="secondary">Storefront /{storeSlug}</Text>
        </VStack>
        <HStack gap="sm">
          <Link to="/dashboard/$storeSlug" params={{ storeSlug }}>
            <Button label="Merchant Console" variant="secondary" size="sm" />
          </Link>
          <Link to="/">
            <Button label="All Stores" variant="ghost" size="sm" />
          </Link>
        </HStack>
      </HStack>
      <VStack gap="lg">{children}</VStack>
    </VStack>
  );
}
