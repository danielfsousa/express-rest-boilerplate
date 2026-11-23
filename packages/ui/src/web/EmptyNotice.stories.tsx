import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, EmptyNotice } from './index.ts';

const meta: Meta<typeof EmptyNotice> = {
  title: 'Web/EmptyNotice',
  component: EmptyNotice,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Primary empty-state title.' },
    description: { control: 'text', description: 'Supporting explanation.' },
    isCompact: { control: 'boolean', description: 'Compact spacing for inline panels.' },
    actions: { control: false, description: 'Optional CTA button.' },
  },
};

export default meta;

type Story = StoryObj<typeof EmptyNotice>;

export const Default: Story = {
  args: {
    title: 'No books in this store yet.',
    description: 'Add your first book to publish it to the storefront.',
    actions: <Button label="Add Book" variant="primary" size="sm" />,
  },
};

export const Compact: Story = {
  args: {
    title: 'No orders placed yet.',
    isCompact: true,
  },
};
