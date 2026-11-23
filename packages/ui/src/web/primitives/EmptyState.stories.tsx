import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Card, EmptyState } from '../index.ts';

const meta: Meta<typeof EmptyState> = {
  title: 'Primitives/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Primary empty-state heading.',
    },
    description: {
      control: 'text',
      description: 'Helpful next-step explanation.',
    },
    isCompact: {
      control: 'boolean',
      description: 'Reduces vertical padding for inline panels.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No books found',
    description: 'Try adjusting your search or filters.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'No books in this store yet',
    description: 'Add your first book to publish it to the storefront.',
    actions: <Button label="Add Book" variant="primary" size="sm" />,
  },
  render: (args) => (
    <Card>
      <EmptyState {...args} />
    </Card>
  ),
};

export const Compact: Story = {
  args: {
    title: 'No orders placed yet',
    isCompact: true,
  },
};
