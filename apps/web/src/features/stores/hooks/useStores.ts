import type { CreateStoreInput, UpdateStoreInput } from '@starter/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '#/lib/api-client.ts';

export function useStores(enabled = true) {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => apiClient.listStores(),
    enabled,
  });
}

export function useStore(storeSlug: string) {
  return useQuery({
    queryKey: ['store', storeSlug],
    queryFn: () => apiClient.getStore(storeSlug),
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStoreInput) => apiClient.createStore(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useUpdateStore(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStoreInput) => apiClient.updateStore(storeSlug, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stores'] });
      void queryClient.invalidateQueries({ queryKey: ['store', storeSlug] });
    },
  });
}
