import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card.tsx';
import { Divider } from './Divider.tsx';
import { Text } from './Text.tsx';
import { EmailStoryGroup, EmailStoryStack, emailCanvasDecorator } from './story-frame.tsx';

const meta: Meta<typeof Divider> = {
  title: 'Email/Divider',
  component: Divider,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['subtle', 'strong'],
      description: 'Border contrast level from starterLightTokens.',
    },
    spacing: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Vertical margin applied above and below the rule.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Subtle: Story = {
  args: {
    tone: 'subtle',
    spacing: 'md',
  },
  render: (args) => (
    <Card>
      <Text tone="primary" size="sm">
        Section above subtle divider
      </Text>
      <Divider {...args} />
      <Text tone="secondary" size="sm">
        Section below subtle divider
      </Text>
    </Card>
  ),
};

export const Strong: Story = {
  args: {
    tone: 'strong',
    spacing: 'md',
  },
  render: (args) => (
    <Card>
      <Text tone="primary" size="sm">
        Line items
      </Text>
      <Divider {...args} />
      <Text tone="primary" size="sm" weight="semibold">
        Total: $39.98
      </Text>
    </Card>
  ),
};

export const ToneComparison: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Compares subtle and strong divider tones with vertical spacing inside a Stone email card.',
      },
    },
  },
  render: () => (
    <Card>
      <EmailStoryStack gap={24}>
        <EmailStoryGroup label="Subtle tone">
          <Text tone="secondary" size="sm">
            Used between loosely related email sections.
          </Text>
          <Divider tone="subtle" spacing="sm" />
          <Text tone="muted" size="xs">
            Footer note below subtle rule.
          </Text>
        </EmailStoryGroup>
        <EmailStoryGroup label="Strong tone">
          <Text tone="primary" size="sm">
            Used inside callouts and totals where contrast matters.
          </Text>
          <Divider tone="strong" spacing="sm" />
          <Text tone="primary" size="sm" weight="semibold">
            Summary row below strong rule.
          </Text>
        </EmailStoryGroup>
      </EmailStoryStack>
    </Card>
  ),
};
