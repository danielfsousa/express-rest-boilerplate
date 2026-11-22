import { createRoute, z } from '@hono/zod-openapi';
import {
  adminOverviewResponseSchema,
  adminStoreSummarySchema,
  adminUpdateStorePlanSchema,
  adminUpdateUserSchema,
  adminUserSummarySchema,
  errorResponseSchema,
  storeSlugSchema,
} from '@starter/contracts';

const storeParamSchema = z.object({
  storeSlug: storeSlugSchema,
});

const userParamSchema = z.object({
  userId: z.string().min(1),
});

export const getAdminOverviewRoute = createRoute({
  method: 'get',
  path: '/api/v1/admin/overview',
  tags: ['Admin'],
  summary: 'Get SaaS platform overview across all tenant stores, subscriptions, and users',
  responses: {
    200: {
      description: 'Platform admin overview',
      content: { 'application/json': { schema: adminOverviewResponseSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Admin role required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const updateAdminStorePlanRoute = createRoute({
  method: 'patch',
  path: '/api/v1/admin/stores/{storeSlug}/plan',
  tags: ['Admin'],
  summary: 'Override a tenant store subscription plan and status',
  request: {
    params: storeParamSchema,
    body: {
      content: { 'application/json': { schema: adminUpdateStorePlanSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated tenant store summary',
      content: { 'application/json': { schema: adminStoreSummarySchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Admin role required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const updateAdminUserRoute = createRoute({
  method: 'patch',
  path: '/api/v1/admin/users/{userId}',
  tags: ['Admin'],
  summary: 'Update a user platform role or ban status',
  request: {
    params: userParamSchema,
    body: {
      content: { 'application/json': { schema: adminUpdateUserSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated user summary',
      content: { 'application/json': { schema: adminUserSummarySchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Admin role required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'User not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
