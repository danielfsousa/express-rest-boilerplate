import type { Env, Hono, Schema } from 'hono';
import type { UpgradeWebSocket } from 'hono/ws';

export type LogValue = string | number | boolean | Error | null | undefined;
export type LogBindings = Record<string, LogValue>;

export interface RuntimeLogger {
  info(bindings: LogBindings, message: string): void;
  info(message: string): void;
  warn(bindings: LogBindings, message: string): void;
  warn(message: string): void;
  error(bindings: LogBindings, message: string): void;
  error(message: string): void;
  child(bindings: LogBindings): RuntimeLogger;
}

export interface CreateLoggerOptions {
  level?: string;
  format?: 'json' | 'pretty' | undefined;
  otelEnabled?: boolean | undefined;
}

export type FetchHandler = (request: Request) => Response | Promise<Response>;

export interface WebSocketAdapter {
  upgradeWebSocket: UpgradeWebSocket;
  attachServer?: ((server: unknown) => void) | undefined;
  bunWebSocket?: unknown;
}

export interface RuntimeServerOptions {
  fetch: FetchHandler;
  port: number;
  hostname?: string;
  webSocketAdapter?: WebSocketAdapter | undefined;
}

export interface RuntimeServerHandle {
  port: number;
  hostname: string;
  url: string;
  close(): Promise<void>;
}

export interface DbClientOptions {
  url: string;
  maxConnections?: number;
}

export interface DbClient {
  ping(timeoutMs?: number): Promise<boolean>;
  close(): Promise<void>;
}

export interface ShutdownOptions {
  drainTimeoutMs?: number;
  logger?: RuntimeLogger;
}

export type ShutdownHandler = (signal: string) => Promise<void> | void;

export interface RuntimeAdapter {
  createLogger(options?: CreateLoggerOptions): RuntimeLogger;
  createServer(options: RuntimeServerOptions): Promise<RuntimeServerHandle>;
  createWebSocketAdapter<E extends Env, S extends Schema, BasePath extends string>(
    app: Hono<E, S, BasePath>,
  ): WebSocketAdapter;
  createDbClient(options: DbClientOptions): DbClient;
  onShutdown(handler: ShutdownHandler, options?: ShutdownOptions): () => void;
  readEnv(): Record<string, string | undefined>;
}
