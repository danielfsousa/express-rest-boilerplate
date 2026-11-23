import type { Meta, StoryObj } from '@storybook/react-vite';
import { HStack, StatusDot, Text, VStack } from '../index.ts';

const meta: Meta<typeof StatusDot> = {
  title: 'Primitives/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'accent', 'neutral'],
      description: 'Semantic status dot color.',
    },
    label: {
      control: 'text',
      description: 'Accessible status label announced to screen readers.',
    },
    isPulsing: {
      control: 'boolean',
      description: 'Adds a live pulse animation for in-flight states.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

export const AllVariants: Story = {
  args: { variant: 'success', label: 'Published' },
  parameters: {
    docs: {
      description: {
        story: 'All StatusDot color variants paired with visible labels.',
      },
    },
  },
  render: () => (
    <HStack gap={5} align="center" wrap="wrap">
      <HStack gap={2} align="center">
        <StatusDot variant="success" label="Published" />
        <Text type="supporting">Published</Text>
      </HStack>
      <HStack gap={2} align="center">
        <StatusDot variant="accent" label="Paid" isPulsing />
        <Text type="supporting">Paid (pulsing)</Text>
      </HStack>
      <HStack gap={2} align="center">
        <StatusDot variant="warning" label="Low stock" />
        <Text type="supporting">Low stock</Text>
      </HStack>
      <HStack gap={2} align="center">
        <StatusDot variant="error" label="Cancelled" />
        <Text type="supporting">Cancelled</Text>
      </HStack>
      <HStack gap={2} align="center">
        <StatusDot variant="neutral" label="Draft" />
        <Text type="supporting">Draft</Text>
      </HStack>
    </HStack>
  ),
};

export const Pulsing: Story = {
  args: { variant: 'success', label: 'Live updates active', isPulsing: true },
  render: (args) => (
    <VStack gap={2}>
      <HStack gap={2} align="center">
        <StatusDot {...args} />
        <Text>{args.label}</Text>
      </HStack>
    </VStack>
  ),
};
