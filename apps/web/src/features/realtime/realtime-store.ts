import { createStore } from '@tanstack/react-store';

export type RealtimeConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export const realtimeStore = createStore(
  {
    status: 'idle',
  },
  ({ setState }) => ({
    setStatus: (status: RealtimeConnectionStatus) => {
      setState((prev) => ({
        ...prev,
        status,
      }));
    },
  }),
);

export function setRealtimeStatus(status: RealtimeConnectionStatus): void {
  realtimeStore.actions.setStatus(status);
}
