import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, Card, HStack, Text, VStack } from '../index.ts';

const meta: Meta<typeof HStack> = {
  title: 'Primitives/HStack',
  component: HStack,
  tags: ['autodocs'],
  argTypes: {
    gap: {
      control: 'select',
      options: [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10],
      description: 'Numeric Astryx SpacingStep between horizontal items.',
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
      description: 'Main-axis flex distribution.',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Cross-axis vertical alignment.',
    },
    wrap: {
      control: 'inline-radio',
      options: ['nowrap', 'wrap', 'wrap-reverse'],
      description: 'Whether items wrap onto multiple lines.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HStack>;

export const Default: Story = {
  args: {
    gap: 3,
    align: 'center',
    children: (
      <>
        <Button label="Save changes" variant="primary" size="sm" />
        <Button label="Cancel" variant="secondary" size="sm" />
      </>
    ),
  },
};

export const SpacingScale: Story = {
  args: { gap: 4 },
  parameters: {
    docs: {
      description: {
        story: 'Numeric SpacingStep gaps (`1` = 4px, `2` = 8px, `4` = 16px, `6` = 24px).',
      },
    },
  },
  render: () => (
    <VStack gap={5}>
      <VStack gap={1}>
        <Text type="label" color="secondary">
          gap=&#123;1&#125; (4px)
        </Text>
        <HStack gap={1}>
          <Badge label="One" variant="neutral" />
          <Badge label="Two" variant="neutral" />
          <Badge label="Three" variant="neutral" />
        </HStack>
      </VStack>
      <VStack gap={1}>
        <Text type="label" color="secondary">
          gap=&#123;3&#125; (12px)
        </Text>
        <HStack gap={3}>
          <Badge label="One" variant="info" />
          <Badge label="Two" variant="info" />
          <Badge label="Three" variant="info" />
        </HStack>
      </VStack>
      <VStack gap={1}>
        <Text type="label" color="secondary">
          gap=&#123;6&#125; (24px)
        </Text>
        <HStack gap={6}>
          <Badge label="One" variant="success" />
          <Badge label="Two" variant="success" />
          <Badge label="Three" variant="success" />
        </HStack>
      </VStack>
    </VStack>
  ),
};

export const JustifyBetween: Story = {
  args: {
    justify: 'between',
    align: 'center',
    children: (
      <>
        <Text weight="semibold">Storefront Header</Text>
        <Button label="Open Console" variant="secondary" size="sm" />
      </>
    ),
  },
  render: (args) => (
    <Card>
      <HStack {...args} />
    </Card>
  ),
};
