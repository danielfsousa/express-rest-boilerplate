/// <reference types="bun" />
import type { Env, Hono, Schema } from 'hono';
import { upgradeWebSocket, websocket } from 'hono/bun';
import { createDbClient, createLogger, onShutdown } from './shared.ts';
import type {
  RuntimeAdapter,
  RuntimeServerHandle,
  RuntimeServerOptions,
  WebSocketAdapter,
} from './types.ts';

export { createDbClient, createLogger, onShutdown } from './shared.ts';

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
  const server = Bun.serve({
    fetch: options.fetch,
    port: options.port,
    hostname,
  });

  const resolvedPort = server.port ?? options.port;
  const resolvedHostname = server.hostname ?? hostname;

  return Promise.resolve({
    port: resolvedPort,
    hostname: resolvedHostname,
    url: `http://${resolvedHostname}:${String(resolvedPort)}`,
    close: async () => {
      await server.stop(true);
    },
  });
}

export function readEnv(): Record<string, string | undefined> {
  return Bun.env;
}

export const runtime: RuntimeAdapter = {
  createLogger,
  createServer,
  createWebSocketAdapter,
  createDbClient,
  onShutdown,
  readEnv,
};
