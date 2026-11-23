import { realtimeEventSchema } from '@starter/contracts';
import type { Order } from '@starter/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getApiBaseUrl, isRealtimeEnabled } from '#/lib/env.ts';
import { realtimeStore } from '../realtime-store.ts';

function toWebSocketUrl(httpBaseUrl: string, path: string): string {
  const parsed = new URL(path, httpBaseUrl);
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  return parsed.toString();
}

export interface UseOrderRealtimeParams {
  storeSlug: string;
  orderId?: string | undefined;
}

export function useOrderRealtime({ storeSlug, orderId }: UseOrderRealtimeParams): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isRealtimeEnabled() || typeof WebSocket === 'undefined') {
      return;
    }

    const querySuffix = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
    const wsUrl = toWebSocketUrl(
      getApiBaseUrl(),
      `/api/v1/stores/${encodeURIComponent(storeSlug)}/ws${querySuffix}`,
    );

    realtimeStore.actions.setStatus('connecting');
    const socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      realtimeStore.actions.setStatus('connected');
    });

    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        return;
      }
      try {
        const parsed = realtimeEventSchema.safeParse(JSON.parse(event.data));
        if (!parsed.success) {
          return;
        }
        const payload = parsed.data;
        if (payload.type === 'order.status_changed') {
          queryClient.setQueryData<Order>(['order', storeSlug, payload.orderId], (prev) =>
            prev ? { ...prev, status: payload.status } : prev,
          );
        }
        void queryClient.invalidateQueries({ queryKey: ['orders', storeSlug] });
        void queryClient.invalidateQueries({ queryKey: ['order', storeSlug, payload.orderId] });
      } catch {
        // Ignore malformed frames.
      }
    });

    socket.addEventListener('close', () => {
      realtimeStore.actions.setStatus('disconnected');
    });

    socket.addEventListener('error', () => {
      realtimeStore.actions.setStatus('disconnected');
    });

    return () => {
      socket.close();
      realtimeStore.actions.setStatus('idle');
    };
  }, [queryClient, storeSlug, orderId]);
}
