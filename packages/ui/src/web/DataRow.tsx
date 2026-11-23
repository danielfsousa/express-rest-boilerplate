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
    <HStack justify="between" align="center" gap={4}>
      <VStack gap={1}>
        <HStack align="center" gap={2}>
          <Text weight="semibold">{title}</Text>
          {status}
        </HStack>
        {subtitle ? <Text color="secondary">{subtitle}</Text> : null}
      </VStack>
      {actions ? (
        <HStack gap={2} align="center">
          {actions}
        </HStack>
      ) : null}
    </HStack>
  );
}
