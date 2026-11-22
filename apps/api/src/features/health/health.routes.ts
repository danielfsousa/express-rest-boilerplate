import { createRoute } from '@hono/zod-openapi';
import { healthLiveResponseSchema, healthReadyResponseSchema } from '@starter/contracts';

export const healthLiveRoute = createRoute({
  method: 'get',
  path: '/health/live',
  tags: ['Health'],
  summary: 'Liveness probe',
  responses: {
    200: {
      description: 'Process is alive',
      content: {
        'application/json': {
          schema: healthLiveResponseSchema,
        },
      },
    },
  },
});

export const healthReadyRoute = createRoute({
  method: 'get',
  path: '/health/ready',
  tags: ['Health'],
  summary: 'Readiness probe',
  responses: {
    200: {
      description: 'Database connection is healthy',
      content: {
        'application/json': {
          schema: healthReadyResponseSchema,
        },
      },
    },
    503: {
      description: 'Database connection is unavailable',
      content: {
        'application/json': {
          schema: healthReadyResponseSchema,
        },
      },
    },
  },
});
