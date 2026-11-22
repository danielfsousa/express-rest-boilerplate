import { serve } from '@hono/node-server';
import { createDbClient, createLogger, onShutdown } from './shared.ts';
import type { RuntimeAdapter, RuntimeServerHandle, RuntimeServerOptions } from './types.ts';

export { createDbClient, createLogger, onShutdown } from './shared.ts';

export function createServer(options: RuntimeServerOptions): Promise<RuntimeServerHandle> {
  const hostname = options.hostname ?? '127.0.0.1';

  return new Promise((resolve, reject) => {
    const server = serve(
      {
        fetch: options.fetch,
        port: options.port,
        hostname,
      },
      (info) => {
        const boundPort = info.port;
        resolve({
          port: boundPort,
          hostname,
          url: `http://${hostname}:${String(boundPort)}`,
          close: () =>
            new Promise<void>((resolveClose, rejectClose) => {
              server.close((err) => {
                if (err) {
                  rejectClose(err);
                  return;
                }
                resolveClose();
              });
            }),
        });
      },
    );

    server.once('error', (err) => {
      reject(err);
    });
  });
}

export function readEnv(): Record<string, string | undefined> {
  return process.env;
}

export const runtime: RuntimeAdapter = {
  createLogger,
  createServer,
  createDbClient,
  onShutdown,
  readEnv,
};
