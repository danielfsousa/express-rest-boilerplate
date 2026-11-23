import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, VStack } from '../index.ts';

const meta: Meta<typeof Text> = {
  title: 'Primitives/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['body', 'large', 'label', 'supporting', 'code'],
      description: 'Typography scale role.',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'disabled', 'accent'],
      description: 'Semantic ink color.',
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
      description: 'Font weight.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Types: Story = {
  args: { children: 'Body text' },
  parameters: {
    docs: {
      description: {
        story: 'Body, label, supporting, and inline code roles in the Stone typography scale.',
      },
    },
  },
  render: () => (
    <VStack gap={3}>
      <Text type="large">Large text — Featured catalog callout</Text>
      <Text type="body">Body text — Standard storefront description copy.</Text>
      <Text type="label">Label text — Form field label</Text>
      <Text type="supporting">Supporting text — Secondary metadata and timestamps</Text>
      <Text type="code">Code text — SKU-DDIA-001</Text>
    </VStack>
  ),
};

export const Colors: Story = {
  args: { children: 'Primary text' },
  render: () => (
    <VStack gap={2}>
      <Text color="primary">Primary ink (#171717)</Text>
      <Text color="secondary">Secondary ink (#4D4D4D)</Text>
      <Text color="disabled">Disabled ink (#7D7D7D)</Text>
    </VStack>
  ),
};

export const Weights: Story = {
  args: { children: 'Weights' },
  render: () => (
    <VStack gap={2}>
      <Text weight="normal">Normal weight (400)</Text>
      <Text weight="medium">Medium weight (500)</Text>
      <Text weight="semibold">Semibold weight (600)</Text>
      <Text weight="bold">Bold weight (700)</Text>
    </VStack>
  ),
};
