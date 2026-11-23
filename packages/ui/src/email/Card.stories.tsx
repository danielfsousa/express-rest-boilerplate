import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.tsx';
import { Callout } from './Callout.tsx';
import { Card } from './Card.tsx';
import { Divider } from './Divider.tsx';
import { Eyebrow } from './Eyebrow.tsx';
import { Heading } from './Heading.tsx';
import { Column, Row, Section } from './Layout.tsx';
import { Link } from './Link.tsx';
import { Text } from './Text.tsx';
import { emailCanvasDecorator } from './story-frame.tsx';

const meta: Meta<typeof Card> = {
  title: 'Email/Card',
  component: Card,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    children: {
      control: false,
      description: 'Body content rendered inside the centered 560px Stone card.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Section spacing="md">
          <Eyebrow>Acme Books</Eyebrow>
          <Heading as="h1">Welcome aboard</Heading>
        </Section>
        <Text tone="secondary" spacing="lg">
          Your merchant storefront is ready. Add your first book to begin accepting orders.
        </Text>
        <Button href="https://example.com/dashboard">Open dashboard</Button>
      </>
    ),
  },
};

export const TransactionalOrder: Story = {
  args: {
    children: 'Order confirmation',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full transactional order confirmation layout composing Eyebrow, Heading, Callout, two-column Row/Column summary, Divider, Button, and fallback Link.',
      },
    },
  },
  render: () => (
    <Card>
      <Section spacing="lg">
        <Eyebrow>Acme Books</Eyebrow>
        <Heading as="h1">Order confirmation</Heading>
      </Section>
      <Text tone="secondary" spacing="lg">
        Your order #ord-42 for $39.98 has been confirmed and queued for fulfillment.
      </Text>
      <Callout tone="muted">
        <Row>
          <Column align="left">
            <Text tone="primary" size="sm">
              Designing Data-Intensive Applications × 1
            </Text>
          </Column>
          <Column align="right">
            <Text tone="primary" size="sm" weight="semibold">
              $39.98
            </Text>
          </Column>
        </Row>
        <Divider tone="strong" spacing="sm" />
        <Row>
          <Column align="left">
            <Text tone="secondary" size="sm">
              Total paid
            </Text>
          </Column>
          <Column align="right">
            <Text tone="success" size="sm" weight="semibold">
              $39.98
            </Text>
          </Column>
        </Row>
      </Callout>
      <Divider spacing="lg" />
      <Section spacing="md">
        <Button href="https://example.com/orders/ord-42">Track order</Button>
      </Section>
      <Text tone="muted" size="xs" breakAll>
        <Link href="https://example.com/orders/ord-42">https://example.com/orders/ord-42</Link>
      </Text>
    </Card>
  ),
};
