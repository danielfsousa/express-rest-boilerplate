import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useSession } from '#/features/auth/index.ts';
import { LocaleSwitcher } from '#/features/i18n/index.ts';
import { authClient } from '#/lib/auth-client.ts';
import { isAdminEnabled } from '#/lib/env.ts';

export interface AppLayoutProps {
  title?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

async function handleStopImpersonating() {
  await authClient.admin.stopImpersonating();
  window.location.assign('/admin');
}

export function AppLayout({
  title = 'Bookstore Platform',
  headerActions,
  children,
}: AppLayoutProps) {
  const sessionQuery = useSession();
  const sessionData = sessionQuery.data;
  const sessionRecord: { id: string; impersonatedBy?: unknown } | undefined = sessionData?.session;
  const impersonatedBy =
    typeof sessionRecord?.impersonatedBy === 'string' ? sessionRecord.impersonatedBy : null;
  const userRecord: { id: string; role?: unknown } | undefined = sessionData?.user;
  const isAdminUser = userRecord?.role === 'admin';

  return (
    <VStack gap="lg" padding="lg">
      {impersonatedBy ? (
        <Banner
          status="warning"
          title={`Impersonating ${sessionData?.user.email ?? 'user'}`}
          description="Actions you perform run as this user."
        >
          <Button
            label="Stop impersonating"
            variant="secondary"
            size="sm"
            onClick={() => {
              void handleStopImpersonating();
            }}
          />
        </Banner>
      ) : null}
      <HStack justify="between" align="center" gap="md">
        <HStack align="center" gap="md">
          <Link to="/">
            <Heading level={2}>{title}</Heading>
          </Link>
        </HStack>
        <HStack align="center" gap="sm">
          {headerActions}
          {isAdminEnabled() && (isAdminUser || impersonatedBy) ? (
            <Link to="/admin">
              <Button label="SaaS Admin" variant="secondary" size="sm" />
            </Link>
          ) : null}
          <LocaleSwitcher />
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
