import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { isMultiTenancyEnabled } from '#/lib/env.ts';
import { useCreateStore } from '../hooks/useStores.ts';

export function CreateStoreForm() {
  const navigate = useNavigate();
  const createStore = useCreateStore();

  const form = useForm({
    defaultValues: {
      name: '',
      slug: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const created = await createStore.mutateAsync({
          name: value.name,
          slug: value.slug,
          lowStockThreshold: 5,
        });
        await navigate({
          to: '/dashboard/$storeSlug',
          params: { storeSlug: created.slug },
        });
      } catch {
        // Error banner renders from createStore.error.
      }
    },
  });

  if (!isMultiTenancyEnabled()) {
    return null;
  }

  return (
    <Card>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
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

          <form.Field name="name">
            {(field) => (
              <TextInput
                label="Store name"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
                placeholder="Acme Books"
              />
            )}
          </form.Field>
          <form.Field name="slug">
            {(field) => (
              <TextInput
                label="Store slug"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
                placeholder="acme-books"
              />
            )}
          </form.Field>

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
