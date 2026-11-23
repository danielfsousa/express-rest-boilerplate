import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.tsx';
import { Card } from './Card.tsx';
import {
  EmailStoryGroup,
  EmailStoryRow,
  EmailStoryStack,
  emailCanvasDecorator,
} from './story-frame.tsx';

const meta: Meta<typeof Button> = {
  title: 'Email/Button',
  component: Button,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    href: {
      control: 'text',
      description: 'Destination URL opened when the recipient clicks the button.',
    },
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'destructive'],
      description: 'Visual emphasis of the email CTA button (pill-shaped like Astryx Stone).',
    },
    children: {
      control: 'text',
      description: 'Visible button label text.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    href: 'https://example.com/orders/ord-42',
    variant: 'primary',
    children: 'Track order',
  },
};

export const Secondary: Story = {
  args: {
    href: 'https://example.com/settings',
    variant: 'secondary',
    children: 'Manage inventory',
  },
};

export const AllVariants: Story = {
  args: {
    href: 'https://example.com',
    variant: 'primary',
    children: 'Track order',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Primary solid accent and secondary bordered email CTA buttons rendered inside a Stone card.',
      },
    },
  },
  render: () => (
    <Card>
      <EmailStoryStack gap={20}>
        <EmailStoryGroup label="Variants">
          <EmailStoryRow gap={16}>
            <Button href="https://example.com/orders/ord-42" variant="primary">
              Track order
            </Button>
            <Button href="https://example.com/settings" variant="secondary">
              Manage inventory
            </Button>
            <Button href="https://example.com/cancel" variant="destructive">
              Cancel order
            </Button>
          </EmailStoryRow>
        </EmailStoryGroup>
      </EmailStoryStack>
    </Card>
  ),
};
