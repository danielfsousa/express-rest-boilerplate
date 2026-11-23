import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.tsx';
import { Card } from './Card.tsx';
import { Divider } from './Divider.tsx';
import type { Document, DocumentProps } from './Document.tsx';
import { Eyebrow } from './Eyebrow.tsx';
import { Heading } from './Heading.tsx';
import { Link } from './Link.tsx';
import { Section } from './Layout.tsx';
import { Text } from './Text.tsx';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_SPACE } from './scale.ts';

/**
 * Renders the Stone canvas & Figtree body preview without nesting raw <html>/<body>
 * tags inside Storybook's live document DOM.
 */
function DocumentPreview({ lang, title, preview, children }: DocumentProps) {
  return (
    <section
      aria-label={`${title} (${lang})`}
      data-preview-text={preview}
      style={{
        backgroundColor: starterLightTokens.colors.canvas,
        color: starterLightTokens.colors.ink,
        fontFamily: starterLightTokens.typography.bodyFamily,
        padding: `${EMAIL_SPACE['2xl']} ${EMAIL_SPACE.md}`,
      }}
    >
      {children}
    </section>
  );
}

const meta: Meta<typeof Document> = {
  title: 'Email/Document',
  component: DocumentPreview,
  tags: ['autodocs'],
  argTypes: {
    lang: {
      control: 'text',
      description: 'BCP-47 language tag placed on the outer <Html> element.',
    },
    title: {
      control: 'text',
      description: 'Email HTML <title> used by webmail previews.',
    },
    preview: {
      control: 'text',
      description: 'Hidden inbox preheader snippet rendered via React Email <Preview>.',
    },
    children: {
      control: false,
      description: 'Email body content, typically a <Card> container.',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Outer transactional email shell wrapping @react-email/components <Html>, <Head>, Figtree <Font>, <Preview>, and Stone-canvas <Body>. Rendered in Storybook using a safe canvas frame to avoid nesting <html>/<body> tags.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Document>;

export const TransactionalPreview: Story = {
  args: {
    lang: 'en',
    title: 'Reset your password',
    preview: 'Use this link to choose a new password within 60 minutes.',
    children: (
      <Card>
        <Section spacing="lg">
          <Eyebrow>ts-blueprint</Eyebrow>
          <Heading as="h1">Reset your password</Heading>
        </Section>
        <Text tone="secondary" spacing="lg">
          We received a request to reset the password for your account. This link expires in 60
          minutes.
        </Text>
        <Section spacing="lg">
          <Button href="https://example.com/reset?token=abc123">Choose new password</Button>
        </Section>
        <Divider spacing="md" />
        <Text tone="muted" size="xs" breakAll>
          Or paste this URL:{' '}
          <Link href="https://example.com/reset?token=abc123">
            https://example.com/reset?token=abc123
          </Link>
        </Text>
      </Card>
    ),
  },
};
