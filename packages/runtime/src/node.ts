import { serve } from '@hono/node-server';
import pino from 'pino';
import postgres from 'postgres';
import type {
  CreateLoggerOptions,
  DbClient,
  DbClientOptions,
  LogBindings,
  RuntimeAdapter,
  RuntimeLogger,
  RuntimeServerHandle,
  RuntimeServerOptions,
  ShutdownHandler,
  ShutdownOptions,
} from './types.ts';

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
  return process.env;
}

export const runtime: RuntimeAdapter = {
  createLogger,
  createServer,
  createDbClient,
  onShutdown,
  readEnv,
};
