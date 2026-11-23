import { Text } from '@starter/ui';
import type { ChangeEvent } from 'react';
import { useUploadBookCover } from '../hooks/useBooks.ts';

export function CoverUpload({ storeSlug, bookId }: { storeSlug: string; bookId: string }) {
  const uploadCover = useUploadBookCover(storeSlug);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    uploadCover.mutate({ bookId, file });
  }

  return (
    <label>
      <Text size="sm">{uploadCover.isPending ? 'Uploading...' : 'Upload cover'}</Text>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
    </label>
  );
}
