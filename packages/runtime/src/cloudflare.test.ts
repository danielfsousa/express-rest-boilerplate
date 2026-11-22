import { describe, expect, test } from 'vite-plus/test';
import {
  createCloudflareKvCache,
  createCloudflareR2BindingStorage,
  createMemoryCache,
  createNoopBotVerifier,
  createTurnstileVerifier,
} from './cloudflare.ts';
import type { CloudflareKvNamespace, CloudflareR2Bucket } from './cloudflare.ts';

describe('Cloudflare free-tier adapters (packages/runtime/cloudflare)', () => {
  test('createCloudflareR2BindingStorage adapts R2Bucket to ObjectStorage', async () => {
    const store = new Map<string, { body: Uint8Array; contentType?: string | undefined }>();
    const fakeBucket: CloudflareR2Bucket = {
      async put(key, value, options) {
        const bytes =
          typeof value === 'string'
            ? new TextEncoder().encode(value)
            : ArrayBuffer.isView(value)
              ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
              : new Uint8Array(value);
        store.set(key, { body: bytes, contentType: options?.httpMetadata?.contentType });
      },
      async get(key) {
        const entry = store.get(key);
        if (!entry) {
          return null;
        }
        return {
          async arrayBuffer() {
            return new Uint8Array(entry.body).buffer;
          },
          httpMetadata: entry.contentType ? { contentType: entry.contentType } : undefined,
        };
      },
      async delete(key) {
        store.delete(key);
      },
    };

    const storage = createCloudflareR2BindingStorage(fakeBucket);
    expect(await storage.getObject('missing')).toBeNull();

    await storage.putObject({
      key: 'covers/1.png',
      body: new Uint8Array([1, 2, 3]),
      contentType: 'image/png',
    });
    const loaded = await storage.getObject('covers/1.png');
    expect(loaded?.contentType).toBe('image/png');
    expect(loaded?.body).toEqual(new Uint8Array([1, 2, 3]));

    await storage.deleteObject('covers/1.png');
    expect(await storage.getObject('covers/1.png')).toBeNull();
  });

  test('createCloudflareKvCache and createMemoryCache satisfy KeyValueCache', async () => {
    const map = new Map<string, string>();
    const fakeKv: CloudflareKvNamespace = {
      async get(key) {
        return map.get(key) ?? null;
      },
      async put(key, value) {
        map.set(key, value);
      },
      async delete(key) {
        map.delete(key);
      },
    };

    for (const cache of [createCloudflareKvCache(fakeKv), createMemoryCache()]) {
      expect(await cache.get('k1')).toBeNull();
      await cache.set({ key: 'k1', value: 'v1', ttlSeconds: 60 });
      expect(await cache.get('k1')).toBe('v1');
      await cache.delete('k1');
      expect(await cache.get('k1')).toBeNull();
    }
  });

  test('createTurnstileVerifier and createNoopBotVerifier verify tokens', async () => {
    const okVerifier = createTurnstileVerifier({
      secretKey: 'turnstile-secret',
      fetchImpl: async () => Response.json({ success: true, 'error-codes': [] }),
    });
    expect(await okVerifier.verify({ token: 'tok', remoteIp: '127.0.0.1' })).toEqual({
      ok: true,
      errorCodes: [],
    });

    const failVerifier = createTurnstileVerifier({
      secretKey: 'turnstile-secret',
      fetchImpl: async () => Response.json({ success: false, 'error-codes': ['invalid-input'] }),
    });
    expect(await failVerifier.verify({ token: 'bad' })).toEqual({
      ok: false,
      errorCodes: ['invalid-input'],
    });

    const noop = createNoopBotVerifier();
    expect(await noop.verify({ token: '' })).toEqual({ ok: true, errorCodes: [] });
  });
});
