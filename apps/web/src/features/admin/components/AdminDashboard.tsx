import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { AdminStoreSummary, AdminUserSummary } from '@starter/contracts';
import { useState } from 'react';
import { formatCurrency } from '#/lib/format.ts';
import {
  useAdminOverview,
  useImpersonateUser,
  useUpdateAdminStorePlan,
  useUpdateAdminUser,
} from '../hooks/useAdmin.ts';

export interface AdminDashboardProps {
  onImpersonated?: ((userId: string) => void) | undefined;
}

export function AdminDashboard({ onImpersonated }: AdminDashboardProps) {
  const { data: overview, isLoading, error } = useAdminOverview();
  const updateStorePlan = useUpdateAdminStorePlan();
  const updateUser = useUpdateAdminUser();
  const impersonateUser = useImpersonateUser();
  const [impersonatedBanner, setImpersonatedBanner] = useState<string | null>(null);

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !overview) {
    return (
      <Banner
        status="error"
        title="Unable to load SaaS admin overview"
        description={error?.message ?? 'Ensure your account has the platform admin role.'}
      />
    );
  }

  async function handleTogglePlan(store: AdminStoreSummary) {
    const nextPlan = store.plan === 'pro' ? 'free' : 'pro';
    await updateStorePlan.mutateAsync({
      storeSlug: store.slug,
      input: { plan: nextPlan, status: 'active' },
    });
  }

  async function handleToggleBan(targetUser: AdminUserSummary) {
    const nextBanned = !targetUser.banned;
    await updateUser.mutateAsync({
      userId: targetUser.id,
      input: {
        banned: nextBanned,
        banReason: nextBanned ? 'Suspended by platform administrator' : null,
      },
    });
  }

  async function handleToggleRole(targetUser: AdminUserSummary) {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    await updateUser.mutateAsync({
      userId: targetUser.id,
      input: { role: nextRole },
    });
  }

  async function handleImpersonate(targetUser: AdminUserSummary) {
    await impersonateUser.mutateAsync(targetUser.id);
    setImpersonatedBanner(`Now impersonating ${targetUser.email}`);
    onImpersonated?.(targetUser.id);
  }

  return (
    <VStack gap="lg">
      <HStack gap="md" wrap="wrap">
        <Card>
          <VStack gap="xs">
            <Text>Total stores</Text>
            <Heading level={3}>{String(overview.totalStores)}</Heading>
          </VStack>
        </Card>
        <Card>
          <VStack gap="xs">
            <Text>Active Pro stores</Text>
            <Heading level={3}>{String(overview.activeProStores)}</Heading>
          </VStack>
        </Card>
        <Card>
          <VStack gap="xs">
            <Text>Total users</Text>
            <Heading level={3}>{String(overview.totalUsers)}</Heading>
          </VStack>
        </Card>
        <Card>
          <VStack gap="xs">
            <Text>Platform GMV</Text>
            <Heading level={3}>{formatCurrency(overview.totalRevenueCents, 'USD')}</Heading>
          </VStack>
        </Card>
      </HStack>

      {impersonatedBanner ? (
        <Banner status="info" title="Impersonation active" description={impersonatedBanner} />
      ) : null}

      <Card>
        <VStack gap="md">
          <Heading level={3}>Tenant stores and billing</Heading>
          {overview.stores.map((store) => (
            <HStack key={store.id} justify="between" align="center" gap="md">
              <VStack gap="xs">
                <HStack gap="sm" align="center">
                  <Heading level={4}>{store.name}</Heading>
                  <Text>({store.slug})</Text>
                  <Badge
                    variant={store.plan === 'pro' ? 'success' : 'neutral'}
                    label={store.plan === 'pro' ? 'Pro' : 'Free'}
                  />
                </HStack>
                <Text>
                  {String(store.publishedBookCount)} published books, {String(store.orderCount)}{' '}
                  orders, {formatCurrency(store.revenueCents, 'USD')} revenue
                </Text>
              </VStack>
              <HStack gap="sm" align="center">
                <Button
                  label={store.plan === 'pro' ? 'Downgrade to Free' : 'Grant Pro'}
                  variant={store.plan === 'pro' ? 'secondary' : 'primary'}
                  size="sm"
                  isLoading={updateStorePlan.isPending}
                  onClick={() => {
                    void handleTogglePlan(store);
                  }}
                />
              </HStack>
            </HStack>
          ))}
        </VStack>
      </Card>

      <Card>
        <VStack gap="md">
          <Heading level={3}>Users and impersonation</Heading>
          {overview.users.map((targetUser) => (
            <HStack key={targetUser.id} justify="between" align="center" gap="md">
              <VStack gap="xs">
                <HStack gap="sm" align="center">
                  <Heading level={4}>{targetUser.name}</Heading>
                  <Text>{targetUser.email}</Text>
                  <Badge
                    variant={targetUser.role === 'admin' ? 'info' : 'neutral'}
                    label={targetUser.role}
                  />
                  {targetUser.banned ? <Badge variant="error" label="Banned" /> : null}
                </HStack>
                <Text>{String(targetUser.storeCount)} store memberships</Text>
              </VStack>
              <HStack gap="sm" align="center">
                <Button
                  label={`Impersonate ${targetUser.name}`}
                  variant="secondary"
                  size="sm"
                  isDisabled={targetUser.banned}
                  isLoading={impersonateUser.isPending}
                  onClick={() => {
                    void handleImpersonate(targetUser);
                  }}
                />
                <Button
                  label={targetUser.role === 'admin' ? 'Demote to user' : 'Make admin'}
                  variant="ghost"
                  size="sm"
                  isLoading={updateUser.isPending}
                  onClick={() => {
                    void handleToggleRole(targetUser);
                  }}
                />
                <Button
                  label={targetUser.banned ? 'Unban user' : 'Ban user'}
                  variant="ghost"
                  size="sm"
                  isLoading={updateUser.isPending}
                  onClick={() => {
                    void handleToggleBan(targetUser);
                  }}
                />
              </HStack>
            </HStack>
          ))}
        </VStack>
      </Card>
    </VStack>
  );
}
