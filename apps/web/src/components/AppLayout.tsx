import { Banner, Button, Heading, PageShell } from '@starter/ui';
import { m } from '@starter/i18n';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useSession } from '#/features/auth/index.ts';
import { LocaleSwitcher, useLocale } from '#/features/i18n/index.ts';
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

export function AppLayout({ title, headerActions, children }: AppLayoutProps) {
  const { locale } = useLocale();
  const resolvedTitle = title ?? m.app_title({}, { locale });
  const sessionQuery = useSession();
  const sessionData = sessionQuery.data;
  const sessionRecord: { id: string; impersonatedBy?: unknown } | undefined = sessionData?.session;
  const impersonatedBy =
    typeof sessionRecord?.impersonatedBy === 'string' ? sessionRecord.impersonatedBy : null;
  const userRecord: { id: string; role?: unknown } | undefined = sessionData?.user;
  const isAdminUser = userRecord?.role === 'admin';

  return (
    <PageShell
      banner={
        impersonatedBy ? (
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
        ) : undefined
      }
      title={
        <Link to="/">
          <Heading level={2}>{resolvedTitle}</Heading>
        </Link>
      }
      actions={
        <>
          {headerActions}
          {isAdminEnabled() && (isAdminUser || impersonatedBy) ? (
            <Link to="/admin">
              <Button label="SaaS Admin" variant="secondary" size="sm" />
            </Link>
          ) : null}
          <LocaleSwitcher />
          <Link to="/auth/sign-in">
            <Button label={m.nav_sign_in({}, { locale })} variant="ghost" size="sm" />
          </Link>
          <Link to="/auth/sign-up">
            <Button label={m.nav_get_started({}, { locale })} variant="primary" size="sm" />
          </Link>
        </>
      }
    >
      {children}
    </PageShell>
  );
}
