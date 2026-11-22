import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Link } from '@tanstack/react-router';
import { useOrder } from '../hooks/useOrders.ts';

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function OrderTracker({ storeSlug, orderId }: { storeSlug: string; orderId: string }) {
  const { data: order, isLoading, error } = useOrder(storeSlug, orderId);

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !order) {
    return <Banner status="error" title="Order not found" />;
  }

  return (
    <Card>
      <VStack gap="md">
        <Heading level={2}>Order {order.id}</Heading>
        <Text>Status: {order.status}</Text>
        <Text color="secondary">
          Customer: {order.customerName} ({order.customerEmail})
        </Text>
        <VStack gap="xs">
          {order.items.map((item) => (
            <HStack key={item.id} justify="between">
              <Text>
                {item.title} × {String(item.quantity)}
              </Text>
              <Text>{formatPrice(item.unitPriceCents * item.quantity, order.currency)}</Text>
            </HStack>
          ))}
        </VStack>
        <Heading level={3}>Total: {formatPrice(order.totalCents, order.currency)}</Heading>
        <Link to="/s/$storeSlug" params={{ storeSlug }}>
          <Button label="Continue shopping" variant="secondary" size="sm" />
        </Link>
      </VStack>
    </Card>
  );
}
