import { Banner, Button, Card, Heading, TextInput, VStack } from '@starter/ui';
import { useForm } from '@tanstack/react-form';
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

  const form = useForm({
    defaultValues: {
      name: initialName,
      threshold: String(initialThreshold),
    },
    onSubmit: async ({ value }) => {
      const parsedThreshold = Number.parseInt(value.threshold, 10);
      try {
        await updateStore.mutateAsync({
          name: value.name,
          lowStockThreshold: Number.isNaN(parsedThreshold) ? 5 : parsedThreshold,
        });
      } catch {
        // Error banner renders from updateStore.error.
      }
    },
  });

  return (
    <Card>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <VStack gap={4}>
          <Heading level={3}>Store settings</Heading>
          {updateStore.isSuccess ? <Banner status="success" title="Store settings saved" /> : null}
          {updateStore.error ? (
            <Banner status="error" title="Update failed" description={updateStore.error.message} />
          ) : null}

          <form.Field name="name">
            {(field) => (
              <TextInput
                label="Store name"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
              />
            )}
          </form.Field>
          <form.Field name="threshold">
            {(field) => (
              <TextInput
                label="Low stock threshold"
                value={field.state.value}
                onChange={field.handleChange}
                inputMode="numeric"
                isRequired
              />
            )}
          </form.Field>

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
