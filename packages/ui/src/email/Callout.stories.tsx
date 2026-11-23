import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from './Callout.tsx';
import { Card } from './Card.tsx';
import { Text } from './Text.tsx';
import { EmailStoryGroup, EmailStoryStack, emailCanvasDecorator } from './story-frame.tsx';

const meta: Meta<typeof Callout> = {
  title: 'Email/Callout',
  component: Callout,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    tone: {
      control: 'select',
      options: ['muted', 'success', 'warning', 'error'],
      description: 'Semantic surface and border color token for the callout box.',
    },
    children: {
      control: false,
      description: 'Email elements displayed inside the callout.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Callout>;

export const Muted: Story = {
  args: {
    tone: 'muted',
    children: (
      <Text tone="primary" size="sm">
        Order #ord-42 · Designing Data-Intensive Applications × 1 ($39.98)
      </Text>
    ),
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
    children: (
      <Text tone="success" size="sm" weight="semibold">
        Payment confirmed — your receipt is attached below.
      </Text>
    ),
  },
};

export const Warning: Story = {
  args: {
    tone: 'warning',
    children: (
      <Text tone="warning" size="sm" weight="semibold">
        Low stock: only 2 copies remaining in catalog.
      </Text>
    ),
  },
};

export const Error: Story = {
  args: {
    tone: 'error',
    children: (
      <Text tone="error" size="sm" weight="semibold">
        Webhook delivery failed 3 times and requires attention.
      </Text>
    ),
  },
};

export const AllTones: Story = {
  args: {
    tone: 'muted',
    children: 'Callout',
  },
  parameters: {
    docs: {
      description: {
        story:
          'All four semantic callout tones stacked with generous spacing inside an email card.',
      },
    },
  },
  render: () => (
    <Card>
      <EmailStoryStack gap={20}>
        <EmailStoryGroup label="Muted">
          <Callout tone="muted">
            <Text tone="primary" size="sm">
              Neutral summary box for line items, totals, or metadata.
            </Text>
          </Callout>
        </EmailStoryGroup>
        <EmailStoryGroup label="Success">
          <Callout tone="success">
            <Text tone="success" size="sm" weight="semibold">
              Order fulfilled and tracking link dispatched.
            </Text>
          </Callout>
        </EmailStoryGroup>
        <EmailStoryGroup label="Warning">
          <Callout tone="warning">
            <Text tone="warning" size="sm" weight="semibold">
              Inventory dropped below your 5-unit threshold.
            </Text>
          </Callout>
        </EmailStoryGroup>
        <EmailStoryGroup label="Error">
          <Callout tone="error">
            <Text tone="error" size="sm" weight="semibold">
              Card charge declined — customer action required.
            </Text>
          </Callout>
        </EmailStoryGroup>
      </EmailStoryStack>
    </Card>
  ),
};
