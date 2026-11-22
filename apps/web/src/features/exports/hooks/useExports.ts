import type { ListStoreExportsResponse, StoreExport } from '@starter/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client.ts';

export function useStoreExports(storeSlug: string) {
  return useQuery<ListStoreExportsResponse>({
    queryKey: ['exports', storeSlug],
    queryFn: () => apiClient.listExports(storeSlug),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasPending = items.some(
        (item) => item.status === 'queued' || item.status === 'processing',
      );
      return hasPending ? 1500 : false;
    },
  });
}

export function useCreateBooksExport(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation<StoreExport, Error>({
    mutationFn: () => apiClient.createBooksExport(storeSlug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['exports', storeSlug] });
    },
  });
}
