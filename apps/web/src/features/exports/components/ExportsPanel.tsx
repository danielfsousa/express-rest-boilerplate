import { Banner, Button, Card, Heading, HStack, Spinner, Text, VStack } from '@starter/ui';
import { getApiBaseUrl } from '#/lib/env.ts';
import { useCreateBooksExport, useStoreExports } from '../hooks/useExports.ts';

export function ExportsPanel({ storeSlug }: { storeSlug: string }) {
  const { data, isLoading, error } = useStoreExports(storeSlug);
  const createExport = useCreateBooksExport(storeSlug);

  return (
    <VStack gap={4}>
      <HStack gap={2} align="center" justify="between">
        <Heading level={3}>Catalog CSV exports</Heading>
        <Button
          label="Export books CSV"
          variant="primary"
          size="sm"
          isLoading={createExport.isPending}
          onClick={() => {
            createExport.mutate();
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
          <HStack gap={2} align="center" justify="between">
            <VStack gap={1}>
              <Text>Export {item.id.slice(0, 8)}</Text>
              <Text>Created: {item.createdAt}</Text>
            </VStack>
            <HStack gap={2} align="center">
              <Text weight="semibold">{item.status}</Text>
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
