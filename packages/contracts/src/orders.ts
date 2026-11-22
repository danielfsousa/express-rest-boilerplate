import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'pending_payment',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderItemSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  title: z.string(),
  sku: z.string(),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  customerId: z.string(),
  customerEmail: z.string().email(),
  customerName: z.string(),
  status: orderStatusSchema,
  totalCents: z.number().int().min(0),
  currency: z.string().length(3),
  stripeCheckoutSessionId: z.string().nullable(),
  checkoutUrl: z.string().nullable().optional(),
  items: z.array(orderItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Order = z.infer<typeof orderSchema>;

export const createOrderItemInputSchema = z.object({
  bookId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
});

export const createOrderSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(160),
  customerLocale: z.enum(['en', 'pt-BR']).default('en'),
  items: z.array(createOrderItemInputSchema).min(1).max(50),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['fulfilled', 'cancelled', 'refunded']),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const listOrdersResponseSchema = z.object({
  orders: z.array(orderSchema),
});

export type ListOrdersResponse = z.infer<typeof listOrdersResponseSchema>;
