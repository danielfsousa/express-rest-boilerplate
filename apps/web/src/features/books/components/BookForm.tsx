import { Banner, Button, Card, Heading, Switch, TextInput, VStack } from '@starter/ui';
import { useForm } from '@tanstack/react-form';
import { useCreateBook } from '../hooks/useBooks.ts';

export function BookForm({ storeSlug }: { storeSlug: string }) {
  const createBook = useCreateBook(storeSlug);

  const form = useForm({
    defaultValues: {
      sku: '',
      title: '',
      author: '',
      description: '',
      priceDollars: '19.99',
      stock: '10',
      published: true,
    },
    onSubmit: async ({ value }) => {
      const parsedPrice = Math.round(Number.parseFloat(value.priceDollars) * 100);
      const parsedStock = Number.parseInt(value.stock, 10);

      try {
        await createBook.mutateAsync({
          sku: value.sku.trim(),
          title: value.title.trim(),
          author: value.author.trim(),
          description: value.description.trim(),
          priceCents: Number.isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice),
          currency: 'USD',
          stock: Number.isNaN(parsedStock) ? 0 : Math.max(0, parsedStock),
          published: value.published,
        });
        form.reset();
      } catch {
        // Error banner renders from createBook.error.
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
          <Heading level={3}>Add book</Heading>
          {createBook.error ? (
            <Banner
              status="error"
              title="Could not create book"
              description={createBook.error.message}
            />
          ) : null}

          <form.Field name="sku">
            {(field) => (
              <TextInput
                label="SKU"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
              />
            )}
          </form.Field>
          <form.Field name="title">
            {(field) => (
              <TextInput
                label="Title"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
              />
            )}
          </form.Field>
          <form.Field name="author">
            {(field) => (
              <TextInput
                label="Author"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
              />
            )}
          </form.Field>
          <form.Field name="description">
            {(field) => (
              <TextInput
                label="Description"
                value={field.state.value}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <form.Field name="priceDollars">
            {(field) => (
              <TextInput
                label="Price (USD)"
                value={field.state.value}
                onChange={field.handleChange}
                inputMode="decimal"
                isRequired
              />
            )}
          </form.Field>
          <form.Field name="stock">
            {(field) => (
              <TextInput
                label="Stock"
                value={field.state.value}
                onChange={field.handleChange}
                inputMode="numeric"
                isRequired
              />
            )}
          </form.Field>
          <form.Field name="published">
            {(field) => (
              <Switch
                label="Publish immediately"
                value={field.state.value}
                onChange={field.handleChange}
              />
            )}
          </form.Field>

          <Button
            type="submit"
            label="Add book"
            variant="primary"
            isLoading={createBook.isPending}
          />
        </VStack>
      </form>
    </Card>
  );
}
