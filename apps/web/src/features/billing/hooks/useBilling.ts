import type { StoreBillingSummary, UpgradeStoreResponse } from '@starter/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '#/lib/api-client.ts';

export function useStoreBilling(storeSlug: string) {
  return useQuery<StoreBillingSummary>({
    queryKey: ['billing', storeSlug],
    queryFn: () => apiClient.getBilling(storeSlug),
  });
}

export function useUpgradeStore(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation<UpgradeStoreResponse, Error>({
    mutationFn: () => apiClient.upgradeStore(storeSlug),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['billing', storeSlug] }),
        queryClient.invalidateQueries({ queryKey: ['books', storeSlug] }),
      ]);
    },
  });
}
