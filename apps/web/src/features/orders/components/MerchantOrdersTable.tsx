import {
  Banner,
  Button,
  DataRow,
  EmptyNotice,
  SectionCard,
  Spinner,
  StatusPill,
} from '@starter/ui';
import { formatCurrency } from '#/lib/format.ts';
import { useOrderRealtime } from '#/features/realtime/index.ts';
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrders.ts';

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
    <SectionCard title={`Orders (${String(data?.orders.length ?? 0)})`}>
      {data?.orders.length === 0 ? <EmptyNotice title="No orders placed yet." isCompact /> : null}
      {data?.orders.map((order) => (
        <DataRow
          key={order.id}
          title={`${order.customerName} (${order.customerEmail})`}
          subtitle={`Total: ${formatCurrency(order.totalCents, order.currency)} · Items: ${String(order.items.length)}`}
          status={<StatusPill tone={orderTone(order.status)} label={order.status} />}
          actions={
            order.status === 'paid' ? (
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
            ) : undefined
          }
        />
      ))}
    </SectionCard>
  );
}
