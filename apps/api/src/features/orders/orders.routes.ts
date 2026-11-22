import { createRoute, z } from '@hono/zod-openapi';
import {
  createOrderSchema,
  errorResponseSchema,
  listOrdersResponseSchema,
  orderSchema,
  updateOrderStatusSchema,
} from '@starter/contracts';

const storeParamSchema = z.object({
  storeSlug: z.string().min(1),
});

const orderParamSchema = z.object({
  storeSlug: z.string().min(1),
  orderId: z.string().uuid(),
});

export const createOrderRoute = createRoute({
  method: 'post',
  path: '/api/v1/stores/{storeSlug}/orders',
  tags: ['Orders'],
  summary: 'Place an order for one or more books',
  request: {
    params: storeParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: createOrderSchema } },
    },
  },
  responses: {
    201: {
      description: 'Order created',
      content: { 'application/json': { schema: orderSchema } },
    },
    404: {
      description: 'Store or book not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Insufficient stock',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const listOrdersRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores/{storeSlug}/orders',
  tags: ['Orders'],
  summary: 'List orders for a store (merchant only)',
  request: {
    params: storeParamSchema,
  },
  responses: {
    200: {
      description: 'Store orders',
      content: { 'application/json': { schema: listOrdersResponseSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Store membership required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const getOrderRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores/{storeSlug}/orders/{orderId}',
  tags: ['Orders'],
  summary: 'Get order details by id',
  request: {
    params: orderParamSchema,
  },
  responses: {
    200: {
      description: 'Order details',
      content: { 'application/json': { schema: orderSchema } },
    },
    404: {
      description: 'Order or store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const updateOrderStatusRoute = createRoute({
  method: 'patch',
  path: '/api/v1/stores/{storeSlug}/orders/{orderId}/status',
  tags: ['Orders'],
  summary: 'Transition order status (merchant only)',
  request: {
    params: orderParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: updateOrderStatusSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated order',
      content: { 'application/json': { schema: orderSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Store membership required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Order or store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Invalid order status transition',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
