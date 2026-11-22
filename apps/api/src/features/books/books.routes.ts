import { createRoute, z } from '@hono/zod-openapi';
import {
  bookSchema,
  createBookSchema,
  deleteBookResponseSchema,
  errorResponseSchema,
  listBooksQuerySchema,
  listBooksResponseSchema,
  updateBookSchema,
  uploadCoverResponseSchema,
} from '@starter/contracts';

const storeParamSchema = z.object({
  storeSlug: z.string().min(1),
});

const bookParamSchema = z.object({
  storeSlug: z.string().min(1),
  bookId: z.string().uuid(),
});

export const listBooksRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores/{storeSlug}/books',
  tags: ['Books'],
  summary: 'List books for a store',
  request: {
    params: storeParamSchema,
    query: listBooksQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated book list',
      content: { 'application/json': { schema: listBooksResponseSchema } },
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const createBookRoute = createRoute({
  method: 'post',
  path: '/api/v1/stores/{storeSlug}/books',
  tags: ['Books'],
  summary: 'Create a book in a store',
  request: {
    params: storeParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: createBookSchema } },
    },
  },
  responses: {
    201: {
      description: 'Book created',
      content: { 'application/json': { schema: bookSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    402: {
      description: 'Store plan book limit reached',
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
    409: {
      description: 'Duplicate SKU in store',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const getBookRoute = createRoute({
  method: 'get',
  path: '/api/v1/stores/{storeSlug}/books/{bookId}',
  tags: ['Books'],
  summary: 'Get a single book by id',
  request: {
    params: bookParamSchema,
  },
  responses: {
    200: {
      description: 'Book details',
      content: { 'application/json': { schema: bookSchema } },
    },
    404: {
      description: 'Book or store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const updateBookRoute = createRoute({
  method: 'patch',
  path: '/api/v1/stores/{storeSlug}/books/{bookId}',
  tags: ['Books'],
  summary: 'Update a book in a store',
  request: {
    params: bookParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: updateBookSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated book',
      content: { 'application/json': { schema: bookSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    402: {
      description: 'Store plan book limit reached',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Store membership required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Book or store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Duplicate SKU in store',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const deleteBookRoute = createRoute({
  method: 'delete',
  path: '/api/v1/stores/{storeSlug}/books/{bookId}',
  tags: ['Books'],
  summary: 'Delete a book from a store',
  request: {
    params: bookParamSchema,
  },
  responses: {
    200: {
      description: 'Book deleted',
      content: { 'application/json': { schema: deleteBookResponseSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    402: {
      description: 'Store plan book limit reached',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Store membership required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Book or store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const uploadBookCoverRoute = createRoute({
  method: 'post',
  path: '/api/v1/stores/{storeSlug}/books/{bookId}/cover',
  tags: ['Books'],
  summary: 'Upload a book cover image',
  request: {
    params: bookParamSchema,
  },
  responses: {
    200: {
      description: 'Cover uploaded',
      content: { 'application/json': { schema: uploadCoverResponseSchema } },
    },
    400: {
      description: 'Invalid cover file',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Authentication required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    402: {
      description: 'Store plan book limit reached',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Store membership required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Book or store not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    413: {
      description: 'Cover exceeds 5 MB',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    503: {
      description: 'Object storage not configured',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
