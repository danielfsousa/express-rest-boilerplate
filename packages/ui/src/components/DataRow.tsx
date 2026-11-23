import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';

export interface DataRowProps {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  actions?: ReactNode;
}

/** Consistent horizontal row for catalog items, orders, and entity lists. */
export function DataRow({ title, subtitle, status, actions }: DataRowProps) {
  return (
    <HStack justify="between" align="center" gap="md">
      <VStack gap="xs">
        <HStack align="center" gap="sm">
          <Text weight="semibold">{title}</Text>
          {status}
        </HStack>
        {subtitle ? <Text color="secondary">{subtitle}</Text> : null}
      </VStack>
      {actions ? (
        <HStack gap="sm" align="center">
          {actions}
        </HStack>
      ) : null}
    </HStack>
  );
}
