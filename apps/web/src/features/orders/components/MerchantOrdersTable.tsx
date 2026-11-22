import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { formatCurrency } from '#/lib/format.ts';
import { useOrderRealtime } from '#/features/realtime/index.ts';
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrders.ts';

export function MerchantOrdersTable({ storeSlug }: { storeSlug: string }) {
  useOrderRealtime({ storeSlug });
  const { data, isLoading, error } = useOrders(storeSlug);
  const updateStatus = useUpdateOrderStatus(storeSlug);

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <Banner status="error" title="Could not load orders" description={error.message} />;
  }

  return (
    <Card>
      <VStack gap="md">
        <Heading level={3}>Orders ({String(data?.orders.length ?? 0)})</Heading>
        {data?.orders.length === 0 ? <Text color="secondary">No orders placed yet.</Text> : null}
        {data?.orders.map((order) => (
          <HStack key={order.id} justify="between" align="center" gap="md">
            <VStack gap="xs">
              <Text weight="semibold">
                {order.customerName} ({order.customerEmail})
              </Text>
              <Text color="secondary">
                Status: {order.status} · Total: {formatCurrency(order.totalCents, order.currency)} ·
                Items: {String(order.items.length)}
              </Text>
            </VStack>
            <HStack gap="sm">
              {order.status === 'paid' ? (
                <>
                  <Button
                    label="Mark Fulfilled"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      void updateStatus.mutateAsync({
                        orderId: order.id,
                        input: { status: 'fulfilled' },
                      });
                    }}
                  />
                  <Button
                    label="Cancel"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      void updateStatus.mutateAsync({
                        orderId: order.id,
                        input: { status: 'cancelled' },
                      });
                    }}
                  />
                </>
              ) : null}
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Card>
  );
}
