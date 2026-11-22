import pino from 'pino';
import postgres from 'postgres';
import type {
  CreateLoggerOptions,
  DbClient,
  DbClientOptions,
  FetchHandler,
  LogBindings,
  RuntimeAdapter,
  RuntimeLogger,
  RuntimeServerHandle,
  RuntimeServerOptions,
  ShutdownHandler,
  ShutdownOptions,
} from './types.ts';

interface BunServer {
  port: number;
  hostname: string;
  stop(closeActiveConnections?: boolean): void;
}

interface BunGlobal {
  serve(options: { fetch: FetchHandler; port: number; hostname: string }): BunServer;
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

function wrapPino(instance: pino.Logger): RuntimeLogger {
  return {
    info(bindingsOrMessage: LogBindings | string, message?: string) {
      if (typeof bindingsOrMessage === 'string') {
        instance.info(bindingsOrMessage);
        return;
      }
      instance.info(bindingsOrMessage, message);
    },
    warn(bindingsOrMessage: LogBindings | string, message?: string) {
      if (typeof bindingsOrMessage === 'string') {
        instance.warn(bindingsOrMessage);
        return;
      }
      instance.warn(bindingsOrMessage, message);
    },
    error(bindingsOrMessage: LogBindings | string, message?: string) {
      if (typeof bindingsOrMessage === 'string') {
        instance.error(bindingsOrMessage);
        return;
      }
      instance.error(bindingsOrMessage, message);
    },
    child(bindings: LogBindings) {
      return wrapPino(instance.child(bindings));
    },
  };
}

export function createLogger(options?: CreateLoggerOptions): RuntimeLogger {
  const instance = pino({
    level: options?.level ?? 'info',
    formatters: {
      level: (label) => ({ status: label }),
    },
  });
  return wrapPino(instance);
}

export function createServer(options: RuntimeServerOptions): Promise<RuntimeServerHandle> {
  const hostname = options.hostname ?? '127.0.0.1';
  const server = getBunGlobal().serve({
    fetch: options.fetch,
    port: options.port,
    hostname,
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

export function createDbClient(options: DbClientOptions): DbClient {
  const sql = postgres(options.url, {
    max: options.maxConnections ?? 10,
    connect_timeout: 2,
  });

  return {
    async ping(timeoutMs = 2000): Promise<boolean> {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Database ping timed out after ${String(timeoutMs)} ms`));
          }, timeoutMs);
        });

        await Promise.race([sql`SELECT 1`, timeoutPromise]);
        return true;
      } catch {
        return false;
      } finally {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
      }
    },
    async close(): Promise<void> {
      await sql.end({ timeout: 5 });
    },
  };
}

export function onShutdown(handler: ShutdownHandler, options?: ShutdownOptions): () => void {
  const drainTimeoutMs = options?.drainTimeoutMs ?? 10_000;
  const logger = options?.logger;
  let shuttingDown = false;

  const runShutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger?.info({ signal }, 'Shutdown signal received');

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<void>((resolve) => {
        timer = setTimeout(() => {
          logger?.error({ signal, drainTimeoutMs }, 'Shutdown drain deadline exceeded');
          resolve();
        }, drainTimeoutMs);
      });

      await Promise.race([Promise.resolve(handler(signal)), timeoutPromise]);
    } catch (error: unknown) {
      logger?.error(
        { err: error instanceof Error ? error : String(error), signal },
        'Error during shutdown',
      );
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  };

  const onSigTerm = (): void => {
    void runShutdown('SIGTERM');
  };
  const onSigInt = (): void => {
    void runShutdown('SIGINT');
  };

  process.on('SIGTERM', onSigTerm);
  process.on('SIGINT', onSigInt);

  return () => {
    process.off('SIGTERM', onSigTerm);
    process.off('SIGINT', onSigInt);
  };
}

export function readEnv(): Record<string, string | undefined> {
  return getBunGlobal().env;
}

export const runtime: RuntimeAdapter = {
  createLogger,
  createServer,
  createDbClient,
  onShutdown,
  readEnv,
};
