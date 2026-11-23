import type { Meta, StoryObj } from '@storybook/react-vite';
import { starterLightTokens } from '../tokens.ts';
import {
  Button,
  Callout,
  Card,
  Column,
  Divider,
  Eyebrow,
  Heading,
  Link,
  Row,
  Section,
  Text,
} from './index.ts';

function EmailKitShowcase() {
  return (
    <Section spacing="none">
      <Card>
        <Section spacing="lg">
          <Eyebrow>Acme Books</Eyebrow>
          <Heading as="h1">Order confirmation</Heading>
        </Section>
        <Text tone="secondary" spacing="lg">
          Your order #ord-42 for $39.98 has been confirmed.
        </Text>
        <Callout tone="muted">
          <Row>
            <Column>
              <Text tone="primary" size="sm">
                Designing Data-Intensive Applications × 1 ($39.98)
              </Text>
            </Column>
          </Row>
          <Divider tone="strong" spacing="sm" />
          <Text tone="success" size="sm" weight="semibold">
            $39.98
          </Text>
        </Callout>
        <Divider spacing="lg" />
        <Section spacing="md">
          <Button href="https://example.com/orders/ord-42">Track Order</Button>
        </Section>
        <Text tone="muted" size="xs" breakAll>
          <Link href="https://example.com/orders/ord-42">https://example.com/orders/ord-42</Link>
        </Text>
      </Card>
    </Section>
  );
}

const meta: Meta<typeof EmailKitShowcase> = {
  title: 'Email/Kit',
  component: EmailKitShowcase,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <section
        style={{
          backgroundColor: starterLightTokens.colors.canvas,
          fontFamily: starterLightTokens.typography.bodyFamily,
          padding: '24px',
        }}
      >
        <Story />
      </section>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof EmailKitShowcase>;

export const Showcase: Story = {};
