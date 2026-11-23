import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Heading, HStack, Text, VStack } from '../index.ts';

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'muted', 'transparent'],
    },
    elevation: {
      control: 'inline-radio',
      options: ['none', 'low', 'med', 'high'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <VStack gap="xs">
        <Heading level={3}>Storefront Card</Heading>
        <Text color="secondary">Default hairline-bordered surface over the stone canvas.</Text>
      </VStack>
    ),
  },
};

export const Muted: Story = {
  args: {
    variant: 'muted',
    children: <Text color="secondary">Muted card for de-emphasized content.</Text>,
  },
};

export const Transparent: Story = {
  args: {
    variant: 'transparent',
    children: <Text color="secondary">Transparent card without border or fill.</Text>,
  },
};

export const Elevations: Story = {
  args: { variant: 'default' },
  render: () => (
    <HStack gap="md">
      <Card elevation="none">
        <Text>None</Text>
      </Card>
      <Card elevation="low">
        <Text>Low</Text>
      </Card>
      <Card elevation="med">
        <Text>Med</Text>
      </Card>
      <Card elevation="high">
        <Text>High</Text>
      </Card>
    </HStack>
  ),
};
