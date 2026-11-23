import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';

export interface SectionCardProps {
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

/** Bordered surface card with an optional section header and divider. */
export function SectionCard({ title, description, headerActions, children }: SectionCardProps) {
  const hasHeader = Boolean(title || description || headerActions);

  return (
    <Card>
      <VStack gap="md">
        {hasHeader ? (
          <>
            <HStack justify="between" align="center" gap="md">
              <VStack gap="xs">
                {title ? <Heading level={3}>{title}</Heading> : null}
                {description ? <Text color="secondary">{description}</Text> : null}
              </VStack>
              {headerActions ? (
                <HStack align="center" gap="sm">
                  {headerActions}
                </HStack>
              ) : null}
            </HStack>
            <Divider />
          </>
        ) : null}
        {children}
      </VStack>
    </Card>
  );
}
