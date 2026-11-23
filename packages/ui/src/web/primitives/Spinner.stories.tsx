import type { Meta, StoryObj } from '@storybook/react-vite';
import { HStack, Spinner, Text, VStack } from '../index.ts';

const meta: Meta<typeof Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Diameter of the loading indicator.',
    },
    shade: {
      control: 'select',
      options: ['default', 'subtle', 'inherit', 'onMedia'],
      description: 'Stroke contrast against the current surface.',
    },
    label: {
      control: 'text',
      description: 'Accessible and optional visible status label.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Sizes: Story = {
  args: { size: 'md' },
  parameters: {
    docs: {
      description: {
        story: 'Spinner size steps aligned horizontally with generous spacing.',
      },
    },
  },
  render: () => (
    <HStack gap={5} align="center" wrap="wrap">
      <VStack gap={2} align="center">
        <Spinner size="sm" />
        <Text type="supporting" color="secondary">
          sm
        </Text>
      </VStack>
      <VStack gap={2} align="center">
        <Spinner size="md" />
        <Text type="supporting" color="secondary">
          md
        </Text>
      </VStack>
      <VStack gap={2} align="center">
        <Spinner size="lg" />
        <Text type="supporting" color="secondary">
          lg
        </Text>
      </VStack>
      <VStack gap={2} align="center">
        <Spinner size="xl" />
        <Text type="supporting" color="secondary">
          xl
        </Text>
      </VStack>
    </HStack>
  ),
};

export const WithLabel: Story = {
  args: { size: 'md', label: 'Loading catalog...' },
};

export const Subtle: Story = {
  args: { size: 'sm', shade: 'subtle', label: 'Syncing...' },
};
