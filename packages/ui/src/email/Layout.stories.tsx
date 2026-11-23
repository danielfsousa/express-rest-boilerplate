import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from './Callout.tsx';
import { Card } from './Card.tsx';
import { Divider } from './Divider.tsx';
import { Column, Row, Section } from './Layout.tsx';
import { Text } from './Text.tsx';
import { EmailStoryGroup, EmailStoryStack, emailCanvasDecorator } from './story-frame.tsx';

const meta: Meta<typeof Section> = {
  title: 'Email/Layout',
  component: Section,
  tags: ['autodocs'],
  decorators: [emailCanvasDecorator],
  argTypes: {
    spacing: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Bottom margin applied to the email Section block.',
    },
    children: {
      control: false,
      description: 'Row, Column, or email content inside the section.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Section>;

export const TwoColumnSummary: Story = {
  args: {
    spacing: 'none',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table-based Section, Row, and aligned Column primitives used for email receipts and summaries.',
      },
    },
  },
  render: () => (
    <Card>
      <Callout tone="muted">
        <Section spacing="xs">
          <Row>
            <Column align="left">
              <Text tone="primary" size="sm">
                Designing Data-Intensive Applications × 1
              </Text>
            </Column>
            <Column align="right">
              <Text tone="primary" size="sm">
                $39.98
              </Text>
            </Column>
          </Row>
        </Section>
        <Section spacing="none">
          <Row>
            <Column align="left">
              <Text tone="primary" size="sm">
                Systems Performance × 1
              </Text>
            </Column>
            <Column align="right">
              <Text tone="primary" size="sm">
                $49.00
              </Text>
            </Column>
          </Row>
        </Section>
        <Divider tone="strong" spacing="sm" />
        <Row>
          <Column align="left">
            <Text tone="secondary" size="sm">
              Total paid
            </Text>
          </Column>
          <Column align="right">
            <Text tone="success" size="sm" weight="semibold">
              $88.98
            </Text>
          </Column>
        </Row>
      </Callout>
    </Card>
  ),
};

export const SectionSpacing: Story = {
  args: {
    spacing: 'md',
  },
  render: () => (
    <Card>
      <EmailStoryStack gap={16}>
        <EmailStoryGroup label='Section spacing="sm" (8px)'>
          <Section spacing="sm">
            <Callout tone="muted">
              <Text size="sm">First block with small bottom spacing</Text>
            </Callout>
          </Section>
          <Callout tone="muted">
            <Text size="sm">Following block</Text>
          </Callout>
        </EmailStoryGroup>
        <EmailStoryGroup label='Section spacing="lg" (20px)'>
          <Section spacing="lg">
            <Callout tone="muted">
              <Text size="sm">First block with large bottom spacing</Text>
            </Callout>
          </Section>
          <Callout tone="muted">
            <Text size="sm">Following block</Text>
          </Callout>
        </EmailStoryGroup>
      </EmailStoryStack>
    </Card>
  ),
};
