import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Switch } from '@astryxdesign/core/Switch';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCreateBook } from '../hooks/useBooks.ts';

export function BookForm({ storeSlug }: { storeSlug: string }) {
  const createBook = useCreateBook(storeSlug);
  const [sku, setSku] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('19.99');
  const [stock, setStock] = useState('10');
  const [published, setPublished] = useState(true);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedPrice = Math.round(Number.parseFloat(priceDollars) * 100);
    const parsedStock = Number.parseInt(stock, 10);

    await createBook.mutateAsync({
      sku: sku.trim(),
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      priceCents: Number.isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice),
      currency: 'USD',
      stock: Number.isNaN(parsedStock) ? 0 : Math.max(0, parsedStock),
      published,
    });

    setSku('');
    setTitle('');
    setAuthor('');
    setDescription('');
  }

  return (
    <Card>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <VStack gap="md">
          <Heading level={3}>Add book</Heading>
          {createBook.error ? (
            <Banner
              status="error"
              title="Could not create book"
              description={createBook.error.message}
            />
          ) : null}
          <TextInput label="SKU" value={sku} onChange={setSku} isRequired />
          <TextInput label="Title" value={title} onChange={setTitle} isRequired />
          <TextInput label="Author" value={author} onChange={setAuthor} isRequired />
          <TextInput label="Description" value={description} onChange={setDescription} />
          <TextInput
            label="Price (USD)"
            value={priceDollars}
            onChange={setPriceDollars}
            inputMode="decimal"
            isRequired
          />
          <TextInput
            label="Stock"
            value={stock}
            onChange={setStock}
            inputMode="numeric"
            isRequired
          />
          <Switch label="Publish immediately" value={published} onChange={setPublished} />
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
