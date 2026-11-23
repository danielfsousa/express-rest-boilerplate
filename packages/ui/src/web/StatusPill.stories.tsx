import type { Meta, StoryObj } from '@storybook/react-vite';
import { HStack, StatusPill, Text, VStack } from './index.ts';

const meta: Meta<typeof StatusPill> = {
  title: 'Web/StatusPill',
  component: StatusPill,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'error'],
      description: 'Semantic dot color.',
    },
    label: {
      control: 'text',
      description: 'Visible status label.',
    },
    isPulsing: {
      control: 'boolean',
      description: 'Pulses the indicator dot for active/live states.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof StatusPill>;

export const Success: Story = {
  args: {
    tone: 'success',
    label: 'Published',
  },
};

export const AllTones: Story = {
  args: {
    tone: 'neutral',
    label: 'Draft',
  },
  parameters: {
    docs: {
      description: {
        story: 'All five semantic StatusPill tones arranged with generous horizontal spacing.',
      },
    },
  },
  render: () => (
    <VStack gap={4}>
      <Text type="label" color="secondary">
        Semantic tones
      </Text>
      <HStack gap={5} align="center" wrap="wrap">
        <StatusPill tone="neutral" label="Draft" />
        <StatusPill tone="info" label="Paid" isPulsing />
        <StatusPill tone="success" label="Fulfilled" />
        <StatusPill tone="warning" label="Low stock" />
        <StatusPill tone="error" label="Cancelled" />
      </HStack>
    </VStack>
  ),
};
