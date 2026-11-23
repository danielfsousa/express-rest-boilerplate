import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, HStack, Text, VStack } from '../index.ts';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Visible button text.',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
      description: 'Visual emphasis variant.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button height and horizontal padding.',
    },
    elevation: {
      control: 'inline-radio',
      options: ['none', 'low', 'med', 'high'],
      description: 'Resting shadow depth.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Replaces content with a spinner and blocks repeat clicks.',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disables pointer and keyboard activation.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { label: 'Publish book', variant: 'primary' },
};

export const Secondary: Story = {
  args: { label: 'Preview storefront', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { label: 'Cancel', variant: 'ghost' },
};

export const Destructive: Story = {
  args: { label: 'Delete book', variant: 'destructive' },
};

export const Sizes: Story = {
  args: { label: 'Medium', variant: 'primary' },
  parameters: {
    docs: {
      description: {
        story:
          'Button size scale from compact toolbar actions (`sm`) to primary calls to action (`lg`).',
      },
    },
  },
  render: () => (
    <HStack gap={3} align="center" wrap="wrap">
      <Button label="Small" variant="primary" size="sm" />
      <Button label="Medium" variant="primary" size="md" />
      <Button label="Large" variant="primary" size="lg" />
    </HStack>
  ),
};

export const WithEndBadge: Story = {
  args: { label: 'Notifications', variant: 'secondary' },
  parameters: {
    docs: {
      description: {
        story:
          'Trailing badge slot inside secondary and ghost buttons for counts or status indicators.',
      },
    },
  },
  render: () => (
    <HStack gap={3} align="center" wrap="wrap">
      <Button
        label="Pending orders"
        variant="secondary"
        endContent={<Badge label="4" variant="info" />}
      />
      <Button
        label="Low stock"
        variant="ghost"
        endContent={<Badge label="2" variant="warning" />}
      />
    </HStack>
  ),
};

export const States: Story = {
  args: { label: 'Saving...', variant: 'primary' },
  parameters: {
    docs: {
      description: {
        story: 'Interactive, loading, and disabled states across button variants.',
      },
    },
  },
  render: () => (
    <HStack gap={3} align="center" wrap="wrap">
      <Button label="Ready" variant="primary" />
      <Button label="Saving..." variant="primary" isLoading />
      <Button label="Disabled" variant="secondary" isDisabled />
      <Button label="Delete disabled" variant="destructive" isDisabled />
    </HStack>
  ),
};

export const AllVariants: Story = {
  args: { label: 'Primary', variant: 'primary' },
  parameters: {
    docs: {
      description: {
        story: 'Complete overview of variants, sizes, and states in the Starter Stone theme.',
      },
    },
  },
  render: () => (
    <VStack gap={6}>
      <VStack gap={2}>
        <Text type="label" color="secondary">
          Variants
        </Text>
        <HStack gap={3} align="center" wrap="wrap">
          <Button label="Primary" variant="primary" />
          <Button label="Secondary" variant="secondary" />
          <Button label="Ghost" variant="ghost" />
          <Button label="Destructive" variant="destructive" />
        </HStack>
      </VStack>
      <VStack gap={2}>
        <Text type="label" color="secondary">
          Sizes
        </Text>
        <HStack gap={3} align="center" wrap="wrap">
          <Button label="Small" variant="secondary" size="sm" />
          <Button label="Medium" variant="secondary" size="md" />
          <Button label="Large" variant="secondary" size="lg" />
        </HStack>
      </VStack>
      <VStack gap={2}>
        <Text type="label" color="secondary">
          States
        </Text>
        <HStack gap={3} align="center" wrap="wrap">
          <Button label="Loading" variant="primary" isLoading />
          <Button label="Disabled" variant="secondary" isDisabled />
        </HStack>
      </VStack>
    </VStack>
  ),
};
