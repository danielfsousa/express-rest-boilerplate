import { z } from 'zod';
import { orderStatusSchema } from './orders.ts';

export const orderCreatedEventSchema = z.object({
  type: z.literal('order.created'),
  storeId: z.string(),
  orderId: z.uuid(),
  status: orderStatusSchema,
  totalCents: z.number().int().min(0),
  currency: z.string(),
  timestamp: z.string(),
});

export const orderStatusChangedEventSchema = z.object({
  type: z.literal('order.status_changed'),
  storeId: z.string(),
  orderId: z.uuid(),
  status: orderStatusSchema,
  timestamp: z.string(),
});

export const realtimeEventSchema = z.discriminatedUnion('type', [
  orderCreatedEventSchema,
  orderStatusChangedEventSchema,
]);

export type OrderCreatedEvent = z.infer<typeof orderCreatedEventSchema>;
export type OrderStatusChangedEvent = z.infer<typeof orderStatusChangedEventSchema>;
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;
