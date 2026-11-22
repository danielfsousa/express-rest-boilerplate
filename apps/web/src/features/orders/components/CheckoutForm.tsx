import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useLocale } from '../../i18n/index.ts';
import { useCreateOrder } from '../hooks/useOrders.ts';

export function CheckoutForm({ storeSlug, bookId }: { storeSlug: string; bookId: string }) {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const createOrder = useCreateOrder(storeSlug);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      customerName: '',
      customerEmail: '',
      quantity: '1',
    },
    onSubmit: async ({ value }) => {
      const parsedQuantity = Number.parseInt(value.quantity, 10);
      try {
        const order = await createOrder.mutateAsync({
          customerName: value.customerName.trim(),
          customerEmail: value.customerEmail.trim(),
          customerLocale: locale,
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

          <form.Field name="customerName">
            {(field) => (
              <TextInput
                label="Your name"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
              />
            )}
          </form.Field>
          <form.Field name="customerEmail">
            {(field) => (
              <TextInput
                type="email"
                label="Email address"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
              />
            )}
          </form.Field>
          <form.Field name="quantity">
            {(field) => (
              <TextInput
                label="Quantity"
                value={field.state.value}
                onChange={field.handleChange}
                inputMode="numeric"
                isRequired
              />
            )}
          </form.Field>

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
