import postgres from 'postgres';

export type RealtimeListener = (payload: string) => void;

export interface RealtimeBroker {
  publish(channel: string, payload: string): Promise<void>;
  subscribe(channel: string, listener: RealtimeListener): () => void;
  close(): Promise<void>;
}

export function createMemoryRealtimeBroker(): RealtimeBroker {
  const listenersByChannel = new Map<string, Set<RealtimeListener>>();

  return {
    async publish(channel, payload) {
      const listeners = listenersByChannel.get(channel);
      if (!listeners) {
        return;
      }
      for (const listener of listeners) {
        listener(payload);
      }
    },
    subscribe(channel, listener) {
      const listeners = listenersByChannel.get(channel) ?? new Set<RealtimeListener>();
      listeners.add(listener);
      listenersByChannel.set(channel, listeners);
      return () => {
        const current = listenersByChannel.get(channel);
        if (!current) {
          return;
        }
        current.delete(listener);
        if (current.size === 0) {
          listenersByChannel.delete(channel);
        }
      };
    },
    async close() {
      listenersByChannel.clear();
    },
  };
}

export function createNoopRealtimeBroker(): RealtimeBroker {
  return {
    async publish() {
      // Realtime disabled.
    },
    subscribe() {
      return () => {};
    },
    async close() {
      // Nothing to close.
    },
  };
}

const PG_REALTIME_CHANNEL = 'bookstore_realtime_events';

function parsePgEnvelope(raw: string): { channel: string; payload: string } | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'channel' in parsed &&
      typeof parsed.channel === 'string' &&
      'payload' in parsed &&
      typeof parsed.payload === 'string'
    ) {
      return { channel: parsed.channel, payload: parsed.payload };
    }
    return null;
  } catch {
    return null;
  }
}

export interface CreatePostgresRealtimeBrokerOptions {
  url: string;
}

export async function createPostgresRealtimeBroker({
  url,
}: CreatePostgresRealtimeBrokerOptions): Promise<RealtimeBroker> {
  const sql = postgres(url, { max: 2, connect_timeout: 5 });
  const listenersByChannel = new Map<string, Set<RealtimeListener>>();

  const listenHandle = await sql.listen(PG_REALTIME_CHANNEL, (rawPayload) => {
    const envelope = parsePgEnvelope(rawPayload);
    if (!envelope) {
      return;
    }
    const listeners = listenersByChannel.get(envelope.channel);
    if (!listeners) {
      return;
    }
    for (const listener of listeners) {
      listener(envelope.payload);
    }
  });

  return {
    async publish(channel, payload) {
      await sql.notify(PG_REALTIME_CHANNEL, JSON.stringify({ channel, payload }));
    },
    subscribe(channel, listener) {
      const listeners = listenersByChannel.get(channel) ?? new Set<RealtimeListener>();
      listeners.add(listener);
      listenersByChannel.set(channel, listeners);
      return () => {
        const current = listenersByChannel.get(channel);
        if (!current) {
          return;
        }
        current.delete(listener);
        if (current.size === 0) {
          listenersByChannel.delete(channel);
        }
      };
    },
    async close() {
      listenersByChannel.clear();
      await listenHandle.unlisten();
      await sql.end({ timeout: 5 });
    },
  };
}
