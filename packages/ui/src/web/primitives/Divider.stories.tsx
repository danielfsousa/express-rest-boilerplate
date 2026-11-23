import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Divider, Text, VStack } from '../index.ts';

const meta: Meta<typeof Divider> = {
  title: 'Primitives/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['subtle', 'strong'],
      description: 'Hairline border contrast.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Subtle: Story = {
  args: { variant: 'subtle' },
};

export const Strong: Story = {
  args: { variant: 'strong' },
};

export const WithContent: Story = {
  args: { variant: 'subtle' },
  parameters: {
    docs: {
      description: {
        story: 'Subtle and strong dividers separating stacked summary sections inside a Card.',
      },
    },
  },
  render: () => (
    <Card>
      <VStack gap={4}>
        <Text>Catalog summary</Text>
        <Divider variant="subtle" />
        <Text color="secondary">Order history</Text>
        <Divider variant="strong" />
        <Text weight="semibold">Total: $39.98</Text>
      </VStack>
    </Card>
  ),
};
