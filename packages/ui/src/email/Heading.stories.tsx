import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card.tsx';
import { Heading } from './Heading.tsx';
import { EmailStoryGroup, EmailStoryStack, emailCanvasDecorator } from './story-frame.tsx';

const meta: Meta<typeof Heading> = {
  title: 'Email/Heading',
  component: Heading,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['h1', 'h2'],
      description: 'Semantic heading tag and Stone email typography step.',
    },
    children: {
      control: 'text',
      description: 'Heading text content.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const H1: Story = {
  args: {
    as: 'h1',
    children: 'Welcome to Acme Books',
  },
  render: (args) => (
    <Card>
      <Heading {...args} />
    </Card>
  ),
};

export const H2: Story = {
  args: {
    as: 'h2',
    children: 'Order summary',
  },
  render: (args) => (
    <Card>
      <Heading {...args} />
    </Card>
  ),
};

export const Scale: Story = {
  args: {
    as: 'h1',
    children: 'Heading scale',
  },
  parameters: {
    docs: {
      description: {
        story: 'Both email heading levels stacked with clear labels inside a Stone card.',
      },
    },
  },
  render: () => (
    <Card>
      <EmailStoryStack gap={24}>
        <EmailStoryGroup label="h1 · 22px / 30px">
          <Heading as="h1">Order confirmation for #ord-42</Heading>
        </EmailStoryGroup>
        <EmailStoryGroup label="h2 · 18px / 26px">
          <Heading as="h2">Shipping &amp; billing details</Heading>
        </EmailStoryGroup>
      </EmailStoryStack>
    </Card>
  ),
};
