import { Store } from '@tanstack/react-store';

export type RealtimeConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export const realtimeStore = new Store<{ status: RealtimeConnectionStatus }>({
  status: 'idle',
});

export function setRealtimeStatus(status: RealtimeConnectionStatus): void {
  realtimeStore.setState(() => ({ status }));
}
