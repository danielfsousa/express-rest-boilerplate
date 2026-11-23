import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Order, OrderStatus, RealtimeEvent } from '@starter/contracts';
import type { Database } from '@starter/db';
import type { RealtimeBroker } from '@starter/runtime/realtime';
import type { WebSocketAdapter } from '@starter/runtime/types';
import { resolveMerchantStore, resolvePublicStore } from '#/middleware/store-context.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import { getOrderForStore } from '../orders/orders.service.ts';

export function storeOrdersChannel(storeId: string): string {
  return `store:${storeId}:orders`;
}

export function orderChannel(orderId: string): string {
  return `order:${orderId}`;
}

export async function publishOrderCreatedEvent(params: {
  broker: RealtimeBroker | undefined;
  order: Order;
}): Promise<void> {
  if (!params.broker) {
    return;
  }
  const event: RealtimeEvent = {
    type: 'order.created',
    storeId: params.order.storeId,
    orderId: params.order.id,
    status: params.order.status,
    totalCents: params.order.totalCents,
    currency: params.order.currency,
    timestamp: new Date().toISOString(),
  };
  const payload = JSON.stringify(event);
  await Promise.all([
    params.broker.publish(storeOrdersChannel(params.order.storeId), payload),
    params.broker.publish(orderChannel(params.order.id), payload),
  ]);
}

export async function publishOrderStatusChangedEvent(params: {
  broker: RealtimeBroker | undefined;
  storeId: string;
  orderId: string;
  status: OrderStatus;
}): Promise<void> {
  if (!params.broker) {
    return;
  }
  const event: RealtimeEvent = {
    type: 'order.status_changed',
    storeId: params.storeId,
    orderId: params.orderId,
    status: params.status,
    timestamp: new Date().toISOString(),
  };
  const payload = JSON.stringify(event);
  await Promise.all([
    params.broker.publish(storeOrdersChannel(params.storeId), payload),
    params.broker.publish(orderChannel(params.orderId), payload),
  ]);
}

export interface RegisterRealtimeRouteParams {
  app: OpenAPIHono;
  db: Database;
  auth: AuthInstance;
  multiTenancyEnabled: boolean;
  broker: RealtimeBroker;
  webSocketAdapter: WebSocketAdapter;
}

export function registerRealtimeRoute({
  app,
  db,
  auth,
  multiTenancyEnabled,
  broker,
  webSocketAdapter,
}: RegisterRealtimeRouteParams): void {
  app.get('/api/v1/stores/:storeSlug/ws', async (c, next) => {
    const storeSlug = c.req.param('storeSlug');
    const orderId = c.req.query('orderId');

    let channel: string;
    if (orderId) {
      const store = await resolvePublicStore({
        db,
        storeSlug,
        multiTenancyEnabled,
      });
      if (!store) {
        return c.json({ error: 'Store not found' }, 404);
      }
      const order = await getOrderForStore({ db, store, orderId });
      if (!order) {
        return c.json({ error: 'Order not found' }, 404);
      }
      channel = orderChannel(order.id);
    } else {
      const ctx = await resolveMerchantStore({
        db,
        auth,
        headers: c.req.raw.headers,
        storeSlug,
        multiTenancyEnabled,
      });
      if (!ctx.ok) {
        return c.json({ error: ctx.error }, ctx.status);
      }
      channel = storeOrdersChannel(ctx.store.id);
    }

    const upgradeHandler = webSocketAdapter.upgradeWebSocket(() => {
      let unsubscribe: (() => void) | undefined;
      return {
        onOpen(_event, ws) {
          unsubscribe = broker.subscribe(channel, (payload) => {
            ws.send(payload);
          });
        },
        onClose() {
          unsubscribe?.();
        },
        onError() {
          unsubscribe?.();
        },
      };
    });

    return upgradeHandler(c, next);
  });
}
