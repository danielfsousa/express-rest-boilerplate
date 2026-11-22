import { errorResponseSchema, storeListResponseSchema, storeSchema } from '@starter/contracts';
import type {
  CreateStoreInput,
  Store,
  StoreListResponse,
  UpdateStoreInput,
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
};
