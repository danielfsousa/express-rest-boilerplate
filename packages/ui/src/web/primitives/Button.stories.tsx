import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, HStack } from '../index.ts';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    elevation: {
      control: 'inline-radio',
      options: ['none', 'low', 'med', 'high'],
    },
    isLoading: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { label: 'Primary Button', variant: 'primary' },
};

export const Secondary: Story = {
  args: { label: 'Secondary Button', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { label: 'Ghost Button', variant: 'ghost' },
};

export const Destructive: Story = {
  args: { label: 'Delete', variant: 'destructive' },
};

export const Sizes: Story = {
  args: { label: 'Medium', variant: 'primary' },
  render: () => (
    <HStack gap="sm" align="center">
      <Button label="Small" variant="primary" size="sm" />
      <Button label="Medium" variant="primary" size="md" />
      <Button label="Large" variant="primary" size="lg" />
    </HStack>
  ),
};

export const Loading: Story = {
  args: { label: 'Saving...', variant: 'primary', isLoading: true },
};

export const Disabled: Story = {
  args: { label: 'Disabled', variant: 'secondary', isDisabled: true },
};

export const AllVariants: Story = {
  args: { label: 'Primary', variant: 'primary' },
  render: () => (
    <HStack gap="sm" align="center">
      <Button label="Primary" variant="primary" size="sm" />
      <Button label="Secondary" variant="secondary" size="sm" />
      <Button label="Ghost" variant="ghost" size="sm" />
      <Button label="Destructive" variant="destructive" size="sm" />
    </HStack>
  ),
};
