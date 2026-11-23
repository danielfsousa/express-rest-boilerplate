import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Text, VStack } from '../index.ts';

const meta: Meta<typeof VStack> = {
  title: 'Primitives/VStack',
  component: VStack,
  tags: ['autodocs'],
  argTypes: {
    gap: { control: 'select', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
    padding: { control: 'select', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
  },
};

export default meta;
type Story = StoryObj<typeof VStack>;

export const Default: Story = {
  args: {
    gap: 'sm',
    children: (
      <>
        <Card>
          <Text>First block</Text>
        </Card>
        <Card>
          <Text>Second block</Text>
        </Card>
      </>
    ),
  },
};

export const WithPadding: Story = {
  args: {
    gap: 'md',
    padding: 'lg',
    children: (
      <>
        <Text weight="semibold">Padded Vertical Stack</Text>
        <Text color="secondary">Used as the primary vertical rhythm across pages.</Text>
      </>
    ),
  },
};
