import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';

export interface PageShellProps {
  banner?: ReactNode;
  title?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Standard page frame with optional top banner, header bar, and vertical stack. */
export function PageShell({ banner, title, subtitle, actions, children }: PageShellProps) {
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <VStack gap="lg" padding="lg">
      {banner}
      {hasHeader ? (
        <HStack justify="between" align="center" gap="md">
          <VStack gap="xs">
            {typeof title === 'string' ? <Heading level={2}>{title}</Heading> : title}
            {subtitle ? <Text color="secondary">{subtitle}</Text> : null}
          </VStack>
          {actions ? (
            <HStack align="center" gap="sm">
              {actions}
            </HStack>
          ) : null}
        </HStack>
      ) : null}
      <VStack gap="lg">{children}</VStack>
    </VStack>
  );
}
