import {
  bookSchema,
  deleteBookResponseSchema,
  errorResponseSchema,
  listBooksResponseSchema,
  storeListResponseSchema,
  storeSchema,
  uploadCoverResponseSchema,
} from '@starter/contracts';
import type {
  Book,
  CreateBookInput,
  CreateStoreInput,
  ListBooksQuery,
  ListBooksResponse,
  Store,
  StoreListResponse,
  UpdateBookInput,
  UpdateStoreInput,
  UploadCoverResponse,
} from '@starter/contracts';
import { getApiBaseUrl } from './env.ts';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  parse: (data: unknown) => T,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type') && typeof init.body === 'string') {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  const payload: unknown = await response.json();
  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(payload);
    throw new ApiError(
      response.status,
      parsedError.success ? parsedError.data.error : 'Request failed',
    );
  }

  return parse(payload);
}

export const apiClient = {
  listStores(): Promise<StoreListResponse> {
    return requestJson('/api/v1/stores', { method: 'GET' }, (data) =>
      storeListResponseSchema.parse(data),
    );
  },
  createStore(input: CreateStoreInput): Promise<Store> {
    return requestJson('/api/v1/stores', { method: 'POST', body: JSON.stringify(input) }, (data) =>
      storeSchema.parse(data),
    );
  },
  getStore(storeSlug: string): Promise<Store> {
    return requestJson(
      `/api/v1/stores/${encodeURIComponent(storeSlug)}`,
      { method: 'GET' },
      (data) => storeSchema.parse(data),
    );
  },
  updateStore(storeSlug: string, input: UpdateStoreInput): Promise<Store> {
    return requestJson(
      `/api/v1/stores/${encodeURIComponent(storeSlug)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
      (data) => storeSchema.parse(data),
    );
  },
  listBooks(storeSlug: string, query?: Partial<ListBooksQuery>): Promise<ListBooksResponse> {
    const params = new URLSearchParams();
    if (query?.q) {
      params.set('q', query.q);
    }
    if (query?.published) {
      params.set('published', query.published);
    }
    if (query?.limit !== undefined) {
      params.set('limit', String(query.limit));
    }
    if (query?.offset !== undefined) {
      params.set('offset', String(query.offset));
    }
    const qs = params.toString();
    const suffix = qs.length > 0 ? `?${qs}` : '';
    return requestJson(
      `/api/v1/stores/${encodeURIComponent(storeSlug)}/books${suffix}`,
      { method: 'GET' },
      (data) => listBooksResponseSchema.parse(data),
    );
  },
  getBook(storeSlug: string, bookId: string): Promise<Book> {
    return requestJson(
      `/api/v1/stores/${encodeURIComponent(storeSlug)}/books/${encodeURIComponent(bookId)}`,
      { method: 'GET' },
      (data) => bookSchema.parse(data),
    );
  },
  createBook(storeSlug: string, input: CreateBookInput): Promise<Book> {
    return requestJson(
      `/api/v1/stores/${encodeURIComponent(storeSlug)}/books`,
      { method: 'POST', body: JSON.stringify(input) },
      (data) => bookSchema.parse(data),
    );
  },
  updateBook(storeSlug: string, bookId: string, input: UpdateBookInput): Promise<Book> {
    return requestJson(
      `/api/v1/stores/${encodeURIComponent(storeSlug)}/books/${encodeURIComponent(bookId)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
      (data) => bookSchema.parse(data),
    );
  },
  deleteBook(storeSlug: string, bookId: string): Promise<{ deleted: true }> {
    return requestJson(
      `/api/v1/stores/${encodeURIComponent(storeSlug)}/books/${encodeURIComponent(bookId)}`,
      { method: 'DELETE' },
      (data) => deleteBookResponseSchema.parse(data),
    );
  },
  uploadBookCover(storeSlug: string, bookId: string, file: File): Promise<UploadCoverResponse> {
    const formData = new FormData();
    formData.set('file', file);
    return requestJson(
      `/api/v1/stores/${encodeURIComponent(storeSlug)}/books/${encodeURIComponent(bookId)}/cover`,
      { method: 'POST', body: formData },
      (data) => uploadCoverResponseSchema.parse(data),
    );
  },
};
