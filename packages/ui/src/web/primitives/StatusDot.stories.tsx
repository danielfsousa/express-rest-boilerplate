import type { Meta, StoryObj } from '@storybook/react-vite';
import { HStack, StatusDot } from '../index.ts';

const meta: Meta<typeof StatusDot> = {
  title: 'Primitives/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'accent', 'neutral'],
    },
    label: { control: 'text' },
    isPulsing: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

export const AllVariants: Story = {
  args: { variant: 'success', label: 'Published' },
  render: () => (
    <HStack gap="md" align="center">
      <StatusDot variant="success" label="Published" />
      <StatusDot variant="accent" label="Paid" />
      <StatusDot variant="warning" label="Low stock" />
      <StatusDot variant="error" label="Cancelled" />
      <StatusDot variant="neutral" label="Draft" />
    </HStack>
  ),
};

export const Pulsing: Story = {
  args: { variant: 'success', label: 'Live updates active', isPulsing: true },
};
