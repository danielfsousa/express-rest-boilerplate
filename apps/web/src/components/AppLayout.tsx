import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

export interface AppLayoutProps {
  title?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function AppLayout({
  title = 'Bookstore Platform',
  headerActions,
  children,
}: AppLayoutProps) {
  return (
    <VStack gap="lg" padding="lg">
      <HStack justify="between" align="center" gap="md">
        <HStack align="center" gap="md">
          <Link to="/">
            <Heading level={2}>{title}</Heading>
          </Link>
        </HStack>
        <HStack align="center" gap="sm">
          {headerActions}
          <Link to="/auth/sign-in">
            <Button label="Sign in" variant="ghost" size="sm" />
          </Link>
          <Link to="/auth/sign-up">
            <Button label="Get started" variant="primary" size="sm" />
          </Link>
        </HStack>
      </HStack>
      <VStack gap="lg">{children}</VStack>
    </VStack>
  );
}
