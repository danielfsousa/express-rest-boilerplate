import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, HStack } from '../index.ts';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'neutral',
        'info',
        'success',
        'warning',
        'error',
        'green',
        'blue',
        'yellow',
        'red',
        'purple',
      ],
    },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Neutral: Story = {
  args: { label: 'Draft', variant: 'neutral' },
};

export const Semantic: Story = {
  args: { label: 'Active', variant: 'success' },
  render: () => (
    <HStack gap="sm">
      <Badge label="Info" variant="info" />
      <Badge label="Active" variant="success" />
      <Badge label="Low Stock" variant="warning" />
      <Badge label="Failed" variant="error" />
    </HStack>
  ),
};

export const AllVariants: Story = {
  args: { label: 'Tag', variant: 'blue' },
  render: () => (
    <HStack gap="sm">
      <Badge label="Neutral" variant="neutral" />
      <Badge label="Green" variant="green" />
      <Badge label="Blue" variant="blue" />
      <Badge label="Yellow" variant="yellow" />
      <Badge label="Red" variant="red" />
      <Badge label="Purple" variant="purple" />
    </HStack>
  ),
};
