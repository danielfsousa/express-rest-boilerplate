import { createRoute, z } from '@hono/zod-openapi';
import {
  createStoreSchema,
  errorResponseSchema,
  storeListResponseSchema,
  storeSchema,
  updateStoreSchema,
} from '@starter/contracts';

const storeSlugParamSchema = z.object({
  storeSlug: z.string().min(1),
});

export const listStoresRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores',
  tags: ['Stores'],
  summary: 'List stores for the authenticated merchant',
  responses: {
    200: {
      description: 'Stores list',
      content: { 'application/json': { schema: storeListResponseSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const createStoreRoute = createRoute({
  method: 'post',
  path: '/api/v1/stores',
  tags: ['Stores'],
  summary: 'Create a store',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createStoreSchema } },
    },
  },
  responses: {
    201: {
      description: 'Store created',
      content: { 'application/json': { schema: storeSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Multi-tenancy disabled',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Slug already exists',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const getStoreRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores/{storeSlug}',
  tags: ['Stores'],
  summary: 'Get public store details by slug',
  request: {
    params: storeSlugParamSchema,
  },
  responses: {
    200: {
      description: 'Store details',
      content: { 'application/json': { schema: storeSchema } },
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const updateStoreRoute = createRoute({
  method: 'patch',
  path: '/api/v1/stores/{storeSlug}',
  tags: ['Stores'],
  summary: 'Update store settings (owner only)',
  request: {
    params: storeSlugParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: updateStoreSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated store',
      content: { 'application/json': { schema: storeSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Owner role required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
