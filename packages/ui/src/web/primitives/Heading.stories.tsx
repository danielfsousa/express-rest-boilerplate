import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading, Text, VStack } from '../index.ts';

const meta: Meta<typeof Heading> = {
  title: 'Primitives/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
      description: 'Semantic HTML heading level (`h1`–`h6`).',
    },
    type: {
      control: 'select',
      options: ['display-1', 'display-2', 'display-3'],
      description: 'Optional oversized editorial display style.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Levels: Story = {
  args: { level: 1, children: 'Heading 1' },
  parameters: {
    docs: {
      description: {
        story: 'Standard semantic heading hierarchy rendered with Figtree typography.',
      },
    },
  },
  render: () => (
    <VStack gap={3}>
      <Heading level={1}>Heading Level 1</Heading>
      <Heading level={2}>Heading Level 2</Heading>
      <Heading level={3}>Heading Level 3</Heading>
      <Heading level={4}>Heading Level 4</Heading>
      <Heading level={5}>Heading Level 5</Heading>
      <Heading level={6}>Heading Level 6</Heading>
    </VStack>
  ),
};

export const Display: Story = {
  args: { level: 1, type: 'display-1', children: 'Editorial Storefront' },
  render: () => (
    <VStack gap={4}>
      <VStack gap={1}>
        <Text type="supporting" color="secondary">
          display-1
        </Text>
        <Heading level={1} type="display-1">
          Editorial Storefront
        </Heading>
      </VStack>
      <VStack gap={1}>
        <Text type="supporting" color="secondary">
          display-2
        </Text>
        <Heading level={2} type="display-2">
          Curated Books
        </Heading>
      </VStack>
      <VStack gap={1}>
        <Text type="supporting" color="secondary">
          display-3
        </Text>
        <Heading level={3} type="display-3">
          Merchant Console
        </Heading>
      </VStack>
    </VStack>
  ),
};
