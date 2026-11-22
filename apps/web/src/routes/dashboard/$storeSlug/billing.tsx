import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '#/components/AppLayout.tsx';
import { BillingPanel } from '#/features/billing/index.ts';
import { StoreSwitcher } from '#/features/stores/index.ts';
import { isBillingEnabled } from '#/lib/env.ts';

export const Route = createFileRoute('/dashboard/$storeSlug/billing')({
  component: BillingDashboardPage,
});

function BillingDashboardPage() {
  const { storeSlug } = Route.useParams();

  return (
    <AppLayout
      title={`Billing: ${storeSlug}`}
      headerActions={<StoreSwitcher activeSlug={storeSlug} />}
    >
      <Link to="/dashboard/$storeSlug" params={{ storeSlug }}>
        <Button label="Back to console" variant="ghost" size="sm" />
      </Link>
      {isBillingEnabled() ? (
        <BillingPanel storeSlug={storeSlug} />
      ) : (
        <Banner
          status="info"
          title="Billing is disabled"
          description="Set VITE_FEATURE_BILLING_ENABLED=true to manage store subscriptions."
        />
      )}
    </AppLayout>
  );
}
