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
      description: 'Section surface variant.',
    },
    padding: {
      control: 'select',
      options: [0, 1, 2, 3, 4, 5, 6, 8],
      description: 'Numeric Astryx spacing step for inner padding.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {
  args: {
    variant: 'section',
    padding: 4,
    children: (
      <VStack gap={1}>
        <Heading level={4}>Section Surface</Heading>
        <Text color="secondary">Default section background.</Text>
      </VStack>
    ),
  },
};

export const Muted: Story = {
  args: {
    variant: 'muted',
    padding: 4,
    children: <Text color="secondary">Muted section surface for grouping.</Text>,
  },
};

export const WithDividers: Story = {
  args: {
    variant: 'section',
    padding: 4,
    dividers: ['top', 'bottom'],
    children: <Text>Section bounded by top and bottom dividers.</Text>,
  },
};
