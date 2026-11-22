import type { CreateBookInput, ListBooksQuery, UpdateBookInput } from '@starter/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client.ts';

export function useBooks(storeSlug: string, query?: Partial<ListBooksQuery>) {
  return useQuery({
    queryKey: ['books', storeSlug, query ?? {}],
    queryFn: () => apiClient.listBooks(storeSlug, query),
  });
}

export function useBook(storeSlug: string, bookId: string) {
  return useQuery({
    queryKey: ['book', storeSlug, bookId],
    queryFn: () => apiClient.getBook(storeSlug, bookId),
  });
}

export function useCreateBook(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookInput) => apiClient.createBook(storeSlug, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books', storeSlug] });
    },
  });
}

export function useUpdateBook(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, input }: { bookId: string; input: UpdateBookInput }) =>
      apiClient.updateBook(storeSlug, bookId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['books', storeSlug] });
      void queryClient.invalidateQueries({
        queryKey: ['book', storeSlug, variables.bookId],
      });
    },
  });
}

export function useDeleteBook(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => apiClient.deleteBook(storeSlug, bookId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books', storeSlug] });
    },
  });
}

export function useUploadBookCover(storeSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, file }: { bookId: string; file: File }) =>
      apiClient.uploadBookCover(storeSlug, bookId, file),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['books', storeSlug] });
      void queryClient.invalidateQueries({
        queryKey: ['book', storeSlug, variables.bookId],
      });
    },
  });
}
