import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  storeBillingSummarySchema,
  upgradeStoreResponseSchema,
} from '@starter/contracts';

const storeParamSchema = z.object({
  storeSlug: z.string().min(1),
});

export const getStoreBillingRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores/{storeSlug}/billing',
  tags: ['Billing'],
  summary: 'Get store subscription plan and published-book usage',
  request: {
    params: storeParamSchema,
  },
  responses: {
    200: {
      description: 'Store billing summary',
      content: { 'application/json': { schema: storeBillingSummarySchema } },
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

export const upgradeStoreBillingRoute = createRoute({
  method: 'post',
  path: '/api/v1/stores/{storeSlug}/billing/upgrade',
  tags: ['Billing'],
  summary: 'Upgrade store subscription to Pro',
  request: {
    params: storeParamSchema,
  },
  responses: {
    200: {
      description: 'Subscription upgraded',
      content: { 'application/json': { schema: upgradeStoreResponseSchema } },
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
