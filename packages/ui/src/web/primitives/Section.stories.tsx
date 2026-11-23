import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading, Section, Text, VStack } from '../index.ts';

const meta: Meta<typeof Section> = {
  title: 'Primitives/Section',
  component: Section,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['section', 'transparent', 'muted'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {
  args: {
    variant: 'section',
    children: (
      <VStack gap="xs">
        <Heading level={4}>Section Surface</Heading>
        <Text color="secondary">Default section background.</Text>
      </VStack>
    ),
  },
};

export const Muted: Story = {
  args: {
    variant: 'muted',
    children: <Text color="secondary">Muted section surface for grouping.</Text>,
  },
};

export const WithDividers: Story = {
  args: {
    variant: 'section',
    dividers: ['top', 'bottom'],
    children: <Text>Section bounded by top and bottom dividers.</Text>,
  },
};
