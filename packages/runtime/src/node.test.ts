import { setTimeout as delay } from 'node:timers/promises';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';
import { createLogger, createServer, onShutdown } from './node.ts';

describe('packages/runtime (node)', () => {
  let activeServer: Awaited<ReturnType<typeof createServer>> | undefined;

  afterEach(async () => {
    await activeServer?.close();
    activeServer = undefined;
  });

  test('createServer binds an ephemeral port, serves HTTP responses, and closes cleanly', async () => {
    activeServer = await createServer({
      port: 0,
      hostname: '127.0.0.1',
      fetch: (request) =>
        new Response(JSON.stringify({ path: new URL(request.url).pathname }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    });

    expect(activeServer.port).toBeGreaterThan(0);
    expect(activeServer.url).toBe(`http://127.0.0.1:${String(activeServer.port)}`);

    const response = await fetch(`${activeServer.url}/ping`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ path: '/ping' });
  });

  test('onShutdown runs handler once on signal and resolves within drainTimeoutMs when handler hangs', async () => {
    const logger = createLogger({ level: 'silent' });
    let callCount = 0;

    const unsubscribe = onShutdown(
      async () => {
        callCount += 1;
        await new Promise(() => {
          // Intentionally never resolves to verify drainTimeoutMs guard.
        });
      },
      { drainTimeoutMs: 50, logger },
    );

    const start = Date.now();
    process.emit('SIGTERM', 'SIGTERM');
    process.emit('SIGTERM', 'SIGTERM');

    await vi.waitFor(() => {
      expect(callCount).toBe(1);
    });

    await delay(80);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(callCount).toBe(1);

    unsubscribe();
  });
});
