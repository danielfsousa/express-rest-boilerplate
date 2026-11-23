import {
  Banner,
  Button,
  Heading,
  HStack,
  SectionCard,
  Spinner,
  StatusPill,
  Text,
  VStack,
} from '@starter/ui';
import { Link } from '@tanstack/react-router';
import { formatCurrency } from '#/lib/format.ts';
import { useOrderRealtime } from '#/features/realtime/index.ts';
import { useOrder } from '../hooks/useOrders.ts';

function orderTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'error' {
  if (status === 'fulfilled') {
    return 'success';
  }
  if (status === 'paid') {
    return 'info';
  }
  if (status === 'cancelled') {
    return 'error';
  }
  return 'neutral';
}

export function OrderTracker({ storeSlug, orderId }: { storeSlug: string; orderId: string }) {
  useOrderRealtime({ storeSlug, orderId });
  const { data: order, isLoading, error } = useOrder(storeSlug, orderId);

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !order) {
    return <Banner status="error" title="Order not found" />;
  }

  return (
    <SectionCard
      title={`Order ${order.id}`}
      description={`Customer: ${order.customerName} (${order.customerEmail})`}
      headerActions={<StatusPill tone={orderTone(order.status)} label={order.status} />}
    >
      <VStack gap={1}>
        {order.items.map((item) => (
          <HStack key={item.id} justify="between">
            <Text>
              {item.title} × {String(item.quantity)}
            </Text>
            <Text>{formatCurrency(item.unitPriceCents * item.quantity, order.currency)}</Text>
          </HStack>
        ))}
      </VStack>
      <Heading level={3}>Total: {formatCurrency(order.totalCents, order.currency)}</Heading>
      <Link to="/s/$storeSlug" params={{ storeSlug }}>
        <Button label="Continue shopping" variant="secondary" size="sm" />
      </Link>
    </SectionCard>
  );
}
