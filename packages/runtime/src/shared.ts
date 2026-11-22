import { setTimeout as delay } from 'node:timers/promises';
import pino from 'pino';
import postgres from 'postgres';
import type {
  CreateLoggerOptions,
  DbClient,
  DbClientOptions,
  LogBindings,
  RuntimeLogger,
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

export function createDbClient(options: DbClientOptions): DbClient {
  const sql = postgres(options.url, {
    max: options.maxConnections ?? 10,
    connect_timeout: 2,
  });

  return {
    async ping(timeoutMs = 2000): Promise<boolean> {
      const controller = new AbortController();
      try {
        const timeoutPromise = delay(timeoutMs, undefined, { signal: controller.signal }).then(
          () => {
            throw new Error(`Database ping timed out after ${String(timeoutMs)} ms`);
          },
        );
        await Promise.race([sql`SELECT 1`, timeoutPromise]);
        return true;
      } catch {
        return false;
      } finally {
        controller.abort();
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

    const controller = new AbortController();
    try {
      const timeoutPromise = delay(drainTimeoutMs, undefined, { signal: controller.signal }).then(
        () => {
          logger?.error({ signal, drainTimeoutMs }, 'Shutdown drain deadline exceeded');
        },
      );
      await Promise.race([Promise.resolve(handler(signal)), timeoutPromise]);
    } catch (error: unknown) {
      logger?.error({ err: String(error), signal }, 'Error during shutdown');
    } finally {
      controller.abort();
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
