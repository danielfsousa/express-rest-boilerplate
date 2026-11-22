import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { isMultiTenancyEnabled } from '../../../lib/env.ts';
import { useCreateStore } from '../hooks/useStores.ts';

export function CreateStoreForm() {
  const navigate = useNavigate();
  const createStore = useCreateStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  if (!isMultiTenancyEnabled()) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await createStore.mutateAsync({
      name,
      slug,
      lowStockThreshold: 5,
    });
    await navigate({
      to: '/dashboard/$storeSlug',
      params: { storeSlug: created.slug },
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
          <Heading level={3}>Create a store</Heading>
          {createStore.error ? (
            <Banner
              status="error"
              title="Could not create store"
              description={createStore.error.message}
            />
          ) : null}
          <TextInput
            label="Store name"
            value={name}
            onChange={setName}
            isRequired
            placeholder="Acme Books"
          />
          <TextInput
            label="Store slug"
            value={slug}
            onChange={setSlug}
            isRequired
            placeholder="acme-books"
          />
          <Button
            type="submit"
            label="Create store"
            variant="primary"
            isLoading={createStore.isPending}
          />
        </VStack>
      </form>
    </Card>
  );
}
