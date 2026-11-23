import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card.tsx';
import { Text } from './Text.tsx';
import { EmailStoryGroup, EmailStoryStack, emailCanvasDecorator } from './story-frame.tsx';

const meta: Meta<typeof Text> = {
  title: 'Email/Text',
  component: Text,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    tone: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'info', 'success', 'warning', 'error'],
      description: 'Semantic Stone ink color token.',
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md'],
      description: 'Font size and line height step from EMAIL_TEXT_SIZE.',
    },
    weight: {
      control: 'inline-radio',
      options: ['normal', 'semibold'],
      description: 'Font weight.',
    },
    spacing: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Bottom margin applied after the paragraph.',
    },
    breakAll: {
      control: 'boolean',
      description: 'Enables word-break: break-all for long tokens and URLs.',
    },
    children: {
      control: 'text',
      description: 'Paragraph text.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    tone: 'secondary',
    size: 'md',
    weight: 'normal',
    spacing: 'none',
    breakAll: false,
    children: 'Your order #ord-42 has been confirmed and queued for fulfillment.',
  },
  render: (args) => (
    <Card>
      <Text {...args} />
    </Card>
  ),
};

export const AllTones: Story = {
  args: {
    children: 'Tone showcase',
  },
  parameters: {
    docs: {
      description: {
        story: 'All semantic text tones and sizes inside a Stone email card.',
      },
    },
  },
  render: () => (
    <Card>
      <EmailStoryStack gap={20}>
        <EmailStoryGroup label="Tones">
          <EmailStoryStack gap={8}>
            <Text tone="primary">Primary ink — main confirmation copy</Text>
            <Text tone="secondary">Secondary ink — supporting explanation</Text>
            <Text tone="muted">Muted ink — timestamps and footer notes</Text>
            <Text tone="success" weight="semibold">
              Success ink — $39.98 paid
            </Text>
            <Text tone="warning" weight="semibold">
              Warning ink — 2 units remaining
            </Text>
            <Text tone="error" weight="semibold">
              Error ink — payment failed
            </Text>
          </EmailStoryStack>
        </EmailStoryGroup>
        <EmailStoryGroup label="Sizes &amp; weights">
          <EmailStoryStack gap={8}>
            <Text tone="primary" size="md" weight="semibold">
              Medium semibold (15px / 24px)
            </Text>
            <Text tone="secondary" size="sm">
              Small normal (13px / 20px)
            </Text>
            <Text tone="muted" size="xs">
              Extra small caption (12px / 18px)
            </Text>
          </EmailStoryStack>
        </EmailStoryGroup>
      </EmailStoryStack>
    </Card>
  ),
};
