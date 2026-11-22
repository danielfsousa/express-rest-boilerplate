import type { CreateOrderInput, UpdateOrderStatusInput } from '@starter/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client.ts';

export function useOrders(storeSlug: string) {
  return useQuery({
    queryKey: ['orders', storeSlug],
    queryFn: () => apiClient.listOrders(storeSlug),
  });
}

export function useOrder(storeSlug: string, orderId: string) {
  return useQuery({
    queryKey: ['order', storeSlug, orderId],
    queryFn: () => apiClient.getOrder(storeSlug, orderId),
  });
}

export function useCreateOrder(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => apiClient.createOrder(storeSlug, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books', storeSlug] });
      void queryClient.invalidateQueries({ queryKey: ['orders', storeSlug] });
    },
  });
}

export function useUpdateOrderStatus(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: UpdateOrderStatusInput }) =>
      apiClient.updateOrderStatus(storeSlug, orderId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['orders', storeSlug] });
      void queryClient.invalidateQueries({
        queryKey: ['order', storeSlug, variables.orderId],
      });
      void queryClient.invalidateQueries({ queryKey: ['books', storeSlug] });
    },
  });
}
