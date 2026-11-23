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
      description: 'Background fill and hairline border style.',
    },
    elevation: {
      control: 'inline-radio',
      options: ['none', 'low', 'med', 'high'],
      description: 'Resting shadow token depth.',
    },
    padding: {
      control: 'select',
      options: [0, 1, 2, 3, 4, 5, 6, 8],
      description: 'Numeric Astryx spacing step for inner card padding.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <VStack gap={2}>
        <Heading level={3}>Storefront Card</Heading>
        <Text color="secondary">Default hairline-bordered surface over the stone canvas.</Text>
      </VStack>
    ),
  },
};

export const Muted: Story = {
  args: {
    variant: 'muted',
    children: <Text color="secondary">Muted card for de-emphasized secondary content.</Text>,
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
  parameters: {
    docs: {
      description: {
        story: 'Compares resting shadow elevations (`none`, `low`, `med`, `high`) side-by-side.',
      },
    },
  },
  render: () => (
    <HStack gap={4} wrap="wrap">
      <Card elevation="none" padding={5} width={180}>
        <VStack gap={1}>
          <Text weight="semibold">None</Text>
          <Text type="supporting" color="secondary">
            Flat hairline border
          </Text>
        </VStack>
      </Card>
      <Card elevation="low" padding={5} width={180}>
        <VStack gap={1}>
          <Text weight="semibold">Low</Text>
          <Text type="supporting" color="secondary">
            Subtle lift
          </Text>
        </VStack>
      </Card>
      <Card elevation="med" padding={5} width={180}>
        <VStack gap={1}>
          <Text weight="semibold">Medium</Text>
          <Text type="supporting" color="secondary">
            Popover surface
          </Text>
        </VStack>
      </Card>
      <Card elevation="high" padding={5} width={180}>
        <VStack gap={1}>
          <Text weight="semibold">High</Text>
          <Text type="supporting" color="secondary">
            Modal elevation
          </Text>
        </VStack>
      </Card>
    </HStack>
  ),
};

export const PaddingScale: Story = {
  args: { variant: 'default' },
  render: () => (
    <HStack gap={4} align="start" wrap="wrap">
      <Card padding={2}>
        <Text type="supporting">padding=&#123;2&#125; (8px)</Text>
      </Card>
      <Card padding={4}>
        <Text type="supporting">padding=&#123;4&#125; (16px)</Text>
      </Card>
      <Card padding={6}>
        <Text type="supporting">padding=&#123;6&#125; (24px)</Text>
      </Card>
    </HStack>
  ),
};
