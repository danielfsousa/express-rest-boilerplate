import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useUpdateStore } from '../hooks/useStores.ts';

export function StoreSettingsForm({
  storeSlug,
  initialName,
  initialThreshold,
}: {
  storeSlug: string;
  initialName: string;
  initialThreshold: number;
}) {
  const updateStore = useUpdateStore(storeSlug);
  const [name, setName] = useState(initialName);
  const [threshold, setThreshold] = useState(String(initialThreshold));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedThreshold = Number.parseInt(threshold, 10);
    await updateStore.mutateAsync({
      name,
      lowStockThreshold: Number.isNaN(parsedThreshold) ? 5 : parsedThreshold,
    });
  }

  return (
    <Card>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <VStack gap="md">
          <Heading level={3}>Store settings</Heading>
          {updateStore.isSuccess ? <Banner status="success" title="Store settings saved" /> : null}
          {updateStore.error ? (
            <Banner status="error" title="Update failed" description={updateStore.error.message} />
          ) : null}
          <TextInput label="Store name" value={name} onChange={setName} isRequired />
          <TextInput
            label="Low stock threshold"
            value={threshold}
            onChange={setThreshold}
            inputMode="numeric"
            isRequired
          />
          <Button
            type="submit"
            label="Save settings"
            variant="primary"
            isLoading={updateStore.isPending}
          />
        </VStack>
      </form>
    </Card>
  );
}
