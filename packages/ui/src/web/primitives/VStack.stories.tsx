import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Text, VStack } from '../index.ts';

const meta: Meta<typeof VStack> = {
  title: 'Primitives/VStack',
  component: VStack,
  tags: ['autodocs'],
  argTypes: {
    gap: {
      control: 'select',
      options: [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10],
      description: 'Numeric Astryx SpacingStep between stacked items.',
    },
    padding: {
      control: 'select',
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10],
      description: 'Numeric Astryx SpacingStep for inner padding.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VStack>;

export const Default: Story = {
  args: {
    gap: 4,
    children: (
      <>
        <Card>
          <Text>First card block</Text>
        </Card>
        <Card>
          <Text>Second card block</Text>
        </Card>
      </>
    ),
  },
};

export const WithPadding: Story = {
  args: {
    gap: 3,
    padding: 6,
    children: (
      <>
        <Text weight="semibold">Padded Vertical Stack</Text>
        <Text color="secondary">Used as the primary vertical rhythm across pages.</Text>
      </>
    ),
  },
};
