import type { Meta, StoryObj } from '@storybook/react-vite';
import { HStack, StatusPill } from './index.ts';

const meta: Meta<typeof StatusPill> = {
  title: 'Web/StatusPill',
  component: StatusPill,
  tags: ['autodocs'],
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
  render: () => (
    <HStack gap="lg">
      <StatusPill tone="neutral" label="Draft" />
      <StatusPill tone="info" label="Paid" isPulsing />
      <StatusPill tone="success" label="Fulfilled" />
      <StatusPill tone="warning" label="Low stock" />
      <StatusPill tone="error" label="Cancelled" />
    </HStack>
  ),
};
