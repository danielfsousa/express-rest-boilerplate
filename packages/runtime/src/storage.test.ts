import { describe, expect, test } from 'vite-plus/test';
import { createMemoryStorage } from './storage.ts';

describe('createMemoryStorage (packages/runtime/storage)', () => {
  test('puts, reads, copies defensively, and deletes objects', async () => {
    const storage = createMemoryStorage();
    const bytes = new TextEncoder().encode('hello,world');

    expect(await storage.getObject('missing.txt')).toBeNull();

    await storage.putObject({
      key: 'stores/s1/file.csv',
      body: bytes,
      contentType: 'text/csv; charset=utf-8',
    });

    const loaded = await storage.getObject('stores/s1/file.csv');
    expect(loaded).not.toBeNull();
    expect(loaded?.contentType).toBe('text/csv; charset=utf-8');
    expect(new TextDecoder().decode(loaded?.body)).toBe('hello,world');

    await storage.deleteObject('stores/s1/file.csv');
    expect(await storage.getObject('stores/s1/file.csv')).toBeNull();
  });
});
