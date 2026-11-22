import { createRoute, z } from '@hono/zod-openapi';
import {
  errorResponseSchema,
  listStoreExportsResponseSchema,
  storeExportSchema,
  storeSlugSchema,
} from '@starter/contracts';

const storeExportParamsSchema = z.object({
  storeSlug: storeSlugSchema,
});

const exportItemParamsSchema = z.object({
  storeSlug: storeSlugSchema,
  exportId: z.uuid(),
});

export const createBooksExportRoute = createRoute({
  method: 'post',
  path: '/api/v1/stores/{storeSlug}/exports/books',
  tags: ['Exports'],
  request: {
    params: storeExportParamsSchema,
  },
  responses: {
    202: {
      description: 'Queued store book catalog CSV export',
      content: { 'application/json': { schema: storeExportSchema } },
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

export const listExportsRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores/{storeSlug}/exports',
  request: {
    params: storeExportParamsSchema,
  },
  responses: {
    200: {
      description: 'List store exports',
      content: { 'application/json': { schema: listStoreExportsResponseSchema } },
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

export const getExportRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores/{storeSlug}/exports/{exportId}',
  request: {
    params: exportItemParamsSchema,
  },
  responses: {
    200: {
      description: 'Get store export status',
      content: { 'application/json': { schema: storeExportSchema } },
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
      description: 'Export or store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
