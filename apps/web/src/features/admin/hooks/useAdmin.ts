import type { AdminUpdateStorePlanInput, AdminUpdateUserInput } from '@starter/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '#/lib/api-client.ts';
import { authClient } from '#/lib/auth-client.ts';

export const adminKeys = {
  overview: ['admin', 'overview'] as const,
};

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview,
    queryFn: () => apiClient.getAdminOverview(),
  });
}

export function useUpdateAdminStorePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeSlug, input }: { storeSlug: string; input: AdminUpdateStorePlanInput }) =>
      apiClient.updateAdminStorePlan(storeSlug, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.overview });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: AdminUpdateUserInput }) =>
      apiClient.updateAdminUser(userId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.overview });
    },
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.impersonateUser({ userId });
      if (result.error) {
        throw new Error(result.error.message ?? 'Failed to impersonate user');
      }
      return result.data;
    },
  });
}
