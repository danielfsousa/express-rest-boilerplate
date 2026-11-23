import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, HStack, Text, VStack } from '../index.ts';

const meta: Meta<typeof HStack> = {
  title: 'Primitives/HStack',
  component: HStack,
  tags: ['autodocs'],
  argTypes: {
    gap: { control: 'select', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between'] },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch'] },
  },
};

export default meta;
type Story = StoryObj<typeof HStack>;

export const Default: Story = {
  args: {
    gap: 'sm',
    align: 'center',
    children: (
      <>
        <Button label="Save" variant="primary" size="sm" />
        <Button label="Cancel" variant="secondary" size="sm" />
      </>
    ),
  },
};

export const Gaps: Story = {
  args: { gap: 'md' },
  render: () => (
    <VStack gap="md">
      <HStack gap="xs">
        <Text>xs</Text>
        <Text>xs</Text>
      </HStack>
      <HStack gap="md">
        <Text>md</Text>
        <Text>md</Text>
      </HStack>
      <HStack gap="lg">
        <Text>lg</Text>
        <Text>lg</Text>
      </HStack>
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
};
