import type { Meta, StoryObj } from '@storybook/react-vite';
import { HStack, Spinner } from '../index.ts';

const meta: Meta<typeof Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    shade: { control: 'select', options: ['default', 'subtle', 'inherit', 'onMedia'] },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Sizes: Story = {
  args: { size: 'md' },
  render: () => (
    <HStack gap="md" align="center">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </HStack>
  ),
};

export const WithLabel: Story = {
  args: { size: 'md', label: 'Loading catalog...' },
};

export const Subtle: Story = {
  args: { size: 'sm', shade: 'subtle', label: 'Syncing...' },
};
