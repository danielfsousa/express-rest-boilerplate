import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { getApiBaseUrl } from '#/lib/env.ts';
import { useCreateBooksExport, useStoreExports } from '../hooks/useExports.ts';

function statusBadgeVariant(status: string): 'neutral' | 'success' | 'error' {
  if (status === 'completed') {
    return 'success';
  }
  if (status === 'failed') {
    return 'error';
  }
  return 'neutral';
}

export function ExportsPanel({ storeSlug }: { storeSlug: string }) {
  const { data, isLoading, error } = useStoreExports(storeSlug);
  const createExport = useCreateBooksExport(storeSlug);

  return (
    <VStack gap="md">
      <HStack gap="sm" align="center" justify="between">
        <Heading level={3}>Catalog CSV exports</Heading>
        <Button
          label="Export books CSV"
          variant="primary"
          size="sm"
          isLoading={createExport.isPending}
          onClick={() => {
            void createExport.mutateAsync();
          }}
        />
      </HStack>

      {createExport.error ? (
        <Banner
          status="error"
          title="Export failed to queue"
          description={createExport.error.message}
        />
      ) : null}

      {isLoading ? <Spinner /> : null}
      {error ? (
        <Banner status="error" title="Unable to load exports" description={error.message} />
      ) : null}

      {data && data.items.length === 0 ? (
        <Card>
          <Text>No exports yet. Click Export books CSV to generate one.</Text>
        </Card>
      ) : null}

      {data?.items.map((item) => (
        <Card key={item.id}>
          <HStack gap="sm" align="center" justify="between">
            <VStack gap="xs">
              <Text>Export {item.id.slice(0, 8)}</Text>
              <Text>Created: {item.createdAt}</Text>
            </VStack>
            <HStack gap="sm" align="center">
              <Badge variant={statusBadgeVariant(item.status)} label={item.status} />
              {item.downloadUrl ? (
                <a href={`${getApiBaseUrl()}${item.downloadUrl}`} target="_blank" rel="noreferrer">
                  Download CSV
                </a>
              ) : null}
            </HStack>
          </HStack>
        </Card>
      ))}
    </VStack>
  );
}
