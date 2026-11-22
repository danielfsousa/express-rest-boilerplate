import { serve } from '@hono/node-server';
import type { ServerType } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import type { Env, Hono, Schema } from 'hono';
import { createDbClient, createLogger, onShutdown } from './shared.ts';
import type {
  RuntimeAdapter,
  RuntimeServerHandle,
  RuntimeServerOptions,
  WebSocketAdapter,
} from './types.ts';

export { createDbClient, createLogger, onShutdown } from './shared.ts';

function isNodeHttpServer(value: unknown): value is ServerType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'on' in value &&
    typeof value.on === 'function' &&
    'close' in value &&
    typeof value.close === 'function'
  );
}

export function createWebSocketAdapter<E extends Env, S extends Schema, BasePath extends string>(
  app: Hono<E, S, BasePath>,
): WebSocketAdapter {
  const nodeWs = createNodeWebSocket({ app });
  return {
    upgradeWebSocket: nodeWs.upgradeWebSocket,
    attachServer: (server: unknown) => {
      if (isNodeHttpServer(server)) {
        nodeWs.injectWebSocket(server);
      }
    },
  };
}

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

    if (options.webSocketAdapter?.attachServer) {
      options.webSocketAdapter.attachServer(server);
    }

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
  createWebSocketAdapter,
  createDbClient,
  onShutdown,
  readEnv,
};
