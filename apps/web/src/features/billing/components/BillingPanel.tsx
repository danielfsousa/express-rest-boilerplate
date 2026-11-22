import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';
import { useStoreBilling, useUpgradeStore } from '../hooks/useBilling.ts';

export function BillingPanel({ storeSlug }: { storeSlug: string }) {
  const { data: billing, isLoading, error } = useStoreBilling(storeSlug);
  const upgrade = useUpgradeStore(storeSlug);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  async function handleUpgrade() {
    const result = await upgrade.mutateAsync();
    if (result.checkoutUrl) {
      setCheckoutUrl(result.checkoutUrl);
    }
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !billing) {
    return (
      <Banner
        status="error"
        title="Unable to load billing summary"
        description={error?.message ?? 'Try refreshing the page.'}
      />
    );
  }

  const limitLabel =
    billing.bookLimit === null
      ? `${billing.publishedBookCount} published (Unlimited)`
      : `${billing.publishedBookCount} / ${billing.bookLimit} published books`;

  return (
    <Card>
      <VStack gap="md">
        <HStack gap="sm" align="center" justify="between">
          <Heading level={3}>Store subscription</Heading>
          <Text weight="semibold">{billing.plan === 'pro' ? 'Pro' : 'Free'}</Text>
        </HStack>

        <Text>Status: {billing.status}</Text>
        <Text>Catalog usage: {limitLabel}</Text>

        {upgrade.error ? (
          <Banner status="error" title="Upgrade failed" description={upgrade.error.message} />
        ) : null}

        {checkoutUrl ? (
          <Banner status="info" title="Checkout session ready">
            <a href={checkoutUrl} target="_blank" rel="noreferrer">
              Complete upgrade in Stripe Checkout
            </a>
          </Banner>
        ) : null}

        {billing.plan === 'free' ? (
          <Button
            label="Upgrade to Pro"
            variant="primary"
            isLoading={upgrade.isPending}
            onClick={() => {
              void handleUpgrade();
            }}
          />
        ) : (
          <Banner
            status="success"
            title="Pro plan active"
            description="Unlimited book listings enabled."
          />
        )}
      </VStack>
    </Card>
  );
}
