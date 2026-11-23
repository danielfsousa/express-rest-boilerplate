import type {
  KVNamespacePutOptions,
  R2HTTPMetadata,
  R2ObjectBody,
} from '@cloudflare/workers-types';
import type { ObjectStorage, StoredObject } from './storage.ts';

/**
 * Minimal structural interface matching Cloudflare Workers R2Bucket binding.
 * Cloudflare R2 Always Free tier: 10 GB storage, 1M Class A ops, 10M Class B ops/month.
 */
export type CloudflareR2ObjectBody = Pick<R2ObjectBody, 'arrayBuffer'> & {
  httpMetadata?: R2HTTPMetadata | undefined;
};

export interface CloudflareR2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string,
    options?: { httpMetadata?: R2HTTPMetadata },
  ): Promise<void>;
  get(key: string): Promise<CloudflareR2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

export function createCloudflareR2BindingStorage(bucket: CloudflareR2Bucket): ObjectStorage {
  return {
    async putObject({ key, body, contentType }) {
      await bucket.put(key, body, {
        httpMetadata: { contentType },
      });
    },
    async getObject(key): Promise<StoredObject | null> {
      const obj = await bucket.get(key);
      if (!obj) {
        return null;
      }
      const buffer = await obj.arrayBuffer();
      return {
        body: new Uint8Array(buffer),
        contentType: obj.httpMetadata?.contentType ?? 'application/octet-stream',
      };
    },
    async deleteObject(key) {
      await bucket.delete(key);
    },
  };
}

/**
 * Key-value cache port backed by Cloudflare KV (Always Free: 100k reads/day, 1k writes/day, 1 GB)
 * or an in-memory map for local development and tests.
 */
export interface KeyValueCache {
  get(key: string): Promise<string | null>;
  set(params: { key: string; value: string; ttlSeconds?: number | undefined }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface CloudflareKvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
}

export function createCloudflareKvCache(kv: CloudflareKvNamespace): KeyValueCache {
  return {
    get: (key) => kv.get(key),
    set: async ({ key, value, ttlSeconds }) => {
      if (typeof ttlSeconds === 'number') {
        await kv.put(key, value, { expirationTtl: ttlSeconds });
        return;
      }
      await kv.put(key, value);
    },
    delete: (key) => kv.delete(key),
  };
}

export function createMemoryCache(): KeyValueCache {
  const entries = new Map<string, { value: string; expiresAt: number | null }>();

  return {
    async get(key) {
      const entry = entries.get(key);
      if (!entry) {
        return null;
      }
      if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
        entries.delete(key);
        return null;
      }
      return entry.value;
    },
    async set({ key, value, ttlSeconds }) {
      const expiresAt = typeof ttlSeconds === 'number' ? Date.now() + ttlSeconds * 1000 : null;
      entries.set(key, { value, expiresAt });
    },
    async delete(key) {
      entries.delete(key);
    },
  };
}

/**
 * Bot verification port backed by Cloudflare Turnstile (Always Free) or a local no-op verifier.
 */
export interface BotVerificationResult {
  ok: boolean;
  errorCodes: Array<string>;
}

export interface BotVerifier {
  verify(params: { token: string; remoteIp?: string | undefined }): Promise<BotVerificationResult>;
}

export interface CreateTurnstileVerifierOptions {
  secretKey: string;
  fetchImpl?: ((request: Request) => Promise<Response>) | undefined;
}

export function createTurnstileVerifier({
  secretKey,
  fetchImpl = (request) => fetch(request),
}: CreateTurnstileVerifierOptions): BotVerifier {
  return {
    async verify({ token, remoteIp }) {
      const form = new URLSearchParams();
      form.set('secret', secretKey);
      form.set('response', token);
      if (remoteIp) {
        form.set('remoteip', remoteIp);
      }

      const response = await fetchImpl(
        new Request('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        }),
      );

      if (!response.ok) {
        return { ok: false, errorCodes: [`http-${String(response.status)}`] };
      }

      const payload: unknown = await response.json();
      if (typeof payload !== 'object' || payload === null) {
        return { ok: false, errorCodes: ['invalid-response'] };
      }
      const success = 'success' in payload && payload.success === true;
      const rawCodes =
        'error-codes' in payload && Array.isArray(payload['error-codes'])
          ? payload['error-codes'].filter((item): item is string => typeof item === 'string')
          : [];
      return { ok: success, errorCodes: rawCodes };
    },
  };
}

export function createNoopBotVerifier(): BotVerifier {
  return {
    async verify() {
      return { ok: true, errorCodes: [] };
    },
  };
}
