import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card.tsx';
import { Link } from './Link.tsx';
import { Text } from './Text.tsx';
import { EmailStoryGroup, EmailStoryStack, emailCanvasDecorator } from './story-frame.tsx';

const meta: Meta<typeof Link> = {
  title: 'Email/Link',
  component: Link,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    href: {
      control: 'text',
      description: 'Destination URL for the anchor element.',
    },
    children: {
      control: 'text',
      description: 'Visible link text or fallback URL.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    href: 'https://example.com/orders/ord-42',
    children: 'View order status',
  },
  render: (args) => (
    <Card>
      <Text size="sm">
        <Link {...args} />
      </Text>
    </Card>
  ),
};

export const InlineAndFallback: Story = {
  args: {
    href: 'https://example.com/orders/ord-42',
    children: 'View order status',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline prose link and break-all fallback URL styling for email clients.',
      },
    },
  },
  render: () => (
    <Card>
      <EmailStoryStack gap={20}>
        <EmailStoryGroup label="Inline in body copy">
          <Text tone="secondary" size="md">
            Need help with your shipment?{' '}
            <Link href="https://example.com/support">Contact merchant support</Link> any time.
          </Text>
        </EmailStoryGroup>
        <EmailStoryGroup label="Break-all fallback URL">
          <Text tone="muted" size="xs" breakAll>
            <Link href="https://example.com/auth/reset-password?token=0192a4b6c8d0e2f4a6b8c0d2e4f6">
              https://example.com/auth/reset-password?token=0192a4b6c8d0e2f4a6b8c0d2e4f6
            </Link>
          </Text>
        </EmailStoryGroup>
      </EmailStoryStack>
    </Card>
  ),
};
