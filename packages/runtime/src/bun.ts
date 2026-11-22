import type { Env, Hono, Schema } from 'hono';
import { upgradeWebSocket, websocket } from 'hono/bun';
import { createDbClient, createLogger, onShutdown } from './shared.ts';
import type {
  FetchHandler,
  RuntimeAdapter,
  RuntimeServerHandle,
  RuntimeServerOptions,
  WebSocketAdapter,
} from './types.ts';

export { createDbClient, createLogger, onShutdown } from './shared.ts';

interface BunServer {
  port: number;
  hostname: string;
  stop(closeActiveConnections?: boolean): void;
}

interface BunGlobal {
  serve(options: {
    fetch: FetchHandler;
    port: number;
    hostname: string;
    websocket?: unknown;
  }): BunServer;
  env: Record<string, string | undefined>;
}

function isBunGlobal(value: unknown): value is BunGlobal {
  return (
    typeof value === 'object' &&
    value !== null &&
    'serve' in value &&
    typeof value.serve === 'function' &&
    'env' in value &&
    typeof value.env === 'object' &&
    value.env !== null
  );
}

declare global {
  var Bun: unknown;
}

function getBunGlobal(): BunGlobal {
  if (!isBunGlobal(globalThis.Bun)) {
    throw new Error('Bun runtime is not available');
  }
  return globalThis.Bun;
}

export function createWebSocketAdapter<E extends Env, S extends Schema, BasePath extends string>(
  _app: Hono<E, S, BasePath>,
): WebSocketAdapter {
  return {
    upgradeWebSocket,
    bunWebSocket: websocket,
  };
}

export function createServer(options: RuntimeServerOptions): Promise<RuntimeServerHandle> {
  const hostname = options.hostname ?? '127.0.0.1';
  const bun = getBunGlobal();
  const server = bun.serve({
    fetch: options.fetch,
    port: options.port,
    hostname,
    websocket: options.webSocketAdapter?.bunWebSocket,
  });

  return Promise.resolve({
    port: server.port,
    hostname: server.hostname,
    url: `http://${server.hostname}:${String(server.port)}`,
    close: () => {
      server.stop(true);
      return Promise.resolve();
    },
  });
}

export function readEnv(): Record<string, string | undefined> {
  return getBunGlobal().env;
}

export const runtime: RuntimeAdapter = {
  createLogger,
  createServer,
  createWebSocketAdapter,
  createDbClient,
  onShutdown,
  readEnv,
};
