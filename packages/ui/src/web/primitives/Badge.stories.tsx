import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, HStack, Text, VStack } from '../index.ts';

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
        'blue',
        'cyan',
        'green',
        'orange',
        'pink',
        'purple',
        'red',
        'teal',
        'yellow',
      ],
      description: 'Semantic or categorical palette color.',
    },
    label: {
      control: 'text',
      description: 'Short label or count inside the badge.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Neutral: Story = {
  args: { label: 'Draft', variant: 'neutral' },
};

export const Semantic: Story = {
  args: { label: 'Active', variant: 'success' },
  parameters: {
    docs: {
      description: {
        story: 'Semantic status badges used for catalog, order, and sync states.',
      },
    },
  },
  render: () => (
    <HStack gap={3} align="center" wrap="wrap">
      <Badge label="Neutral" variant="neutral" />
      <Badge label="Info" variant="info" />
      <Badge label="Published" variant="success" />
      <Badge label="Low stock" variant="warning" />
      <Badge label="Cancelled" variant="error" />
    </HStack>
  ),
};

export const AllVariants: Story = {
  args: { label: 'Tag', variant: 'blue' },
  parameters: {
    docs: {
      description: {
        story:
          'Semantic statuses, numeric counts, and categorical palette badges grouped with generous spacing.',
      },
    },
  },
  render: () => (
    <VStack gap={6}>
      <VStack gap={2}>
        <Text type="label" color="secondary">
          Semantic
        </Text>
        <HStack gap={3} align="center" wrap="wrap">
          <Badge label="Neutral" variant="neutral" />
          <Badge label="Info" variant="info" />
          <Badge label="Success" variant="success" />
          <Badge label="Warning" variant="warning" />
          <Badge label="Error" variant="error" />
        </HStack>
      </VStack>
      <VStack gap={2}>
        <Text type="label" color="secondary">
          Counts
        </Text>
        <HStack gap={3} align="center" wrap="wrap">
          <Badge label="3" variant="neutral" />
          <Badge label="12" variant="info" />
          <Badge label="99+" variant="error" />
        </HStack>
      </VStack>
      <VStack gap={2}>
        <Text type="label" color="secondary">
          Palette
        </Text>
        <HStack gap={3} align="center" wrap="wrap">
          <Badge label="Blue" variant="blue" />
          <Badge label="Cyan" variant="cyan" />
          <Badge label="Green" variant="green" />
          <Badge label="Orange" variant="orange" />
          <Badge label="Pink" variant="pink" />
          <Badge label="Purple" variant="purple" />
          <Badge label="Red" variant="red" />
          <Badge label="Teal" variant="teal" />
          <Badge label="Yellow" variant="yellow" />
        </HStack>
      </VStack>
    </VStack>
  ),
};
