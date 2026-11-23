import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card.tsx';
import { Eyebrow } from './Eyebrow.tsx';
import { Heading } from './Heading.tsx';
import { Section } from './Layout.tsx';
import { emailCanvasDecorator } from './story-frame.tsx';

const meta: Meta<typeof Eyebrow> = {
  title: 'Email/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    children: {
      control: 'text',
      description: 'Uppercase tracked store or category label placed above an email heading.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Eyebrow>;

export const Default: Story = {
  args: {
    children: 'Acme Books',
  },
  render: (args) => (
    <Card>
      <Eyebrow {...args} />
    </Card>
  ),
};

export const PairedWithHeading: Story = {
  args: {
    children: 'Inventory Alert',
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical header pairing of an Eyebrow above an email Heading inside a Section.',
      },
    },
  },
  render: (args) => (
    <Card>
      <Section spacing="none">
        <Eyebrow {...args} />
        <Heading as="h1">3 titles are running low on stock</Heading>
      </Section>
    </Card>
  ),
};
