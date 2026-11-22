import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCreateOrder } from '../hooks/useOrders.ts';

export function CheckoutForm({ storeSlug, bookId }: { storeSlug: string; bookId: string }) {
  const navigate = useNavigate();
  const createOrder = useCreateOrder(storeSlug);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = Number.parseInt(quantity, 10);
    try {
      const order = await createOrder.mutateAsync({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerLocale: 'en',
        items: [
          {
            bookId,
            quantity: Number.isNaN(parsedQuantity) || parsedQuantity < 1 ? 1 : parsedQuantity,
          },
        ],
      });
      if (order.checkoutUrl) {
        setCheckoutUrl(order.checkoutUrl);
        return;
      }
      await navigate({
        to: '/s/$storeSlug/orders/$orderId',
        params: { storeSlug, orderId: order.id },
      });
    } catch {
      // Error banner renders from createOrder.error.
    }
  }

  return (
    <Card>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <VStack gap="md">
          <Heading level={3}>Checkout</Heading>
          {checkoutUrl ? (
            <Banner status="info" title="Complete your payment">
              <a href={checkoutUrl} target="_blank" rel="noreferrer">
                Proceed to Stripe Checkout
              </a>
            </Banner>
          ) : null}
          {createOrder.error ? (
            <Banner
              status="error"
              title="Checkout failed"
              description={createOrder.error.message}
            />
          ) : null}
          <TextInput label="Your name" value={customerName} onChange={setCustomerName} isRequired />
          <TextInput
            type="email"
            label="Email address"
            value={customerEmail}
            onChange={setCustomerEmail}
            isRequired
          />
          <TextInput
            label="Quantity"
            value={quantity}
            onChange={setQuantity}
            inputMode="numeric"
            isRequired
          />
          <Button
            type="submit"
            label="Place order"
            variant="primary"
            isLoading={createOrder.isPending}
          />
        </VStack>
      </form>
    </Card>
  );
}
