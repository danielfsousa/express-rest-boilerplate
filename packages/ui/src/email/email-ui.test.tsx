import { render } from '@react-email/components';
import { describe, expect, test } from 'vite-plus/test';
import { starterLightTokens } from '../tokens.ts';
import {
  Button,
  Callout,
  Card,
  Column,
  Divider,
  Document,
  Eyebrow,
  Heading,
  Link,
  Row,
  Section,
  Text,
  toEmailPx,
} from './index.ts';

describe('@starter/ui/email', () => {
  test('converts rem length tokens to email-safe px values', () => {
    expect(toEmailPx('0.25rem')).toBe('4px');
    expect(toEmailPx('0.5rem')).toBe('8px');
    expect(toEmailPx('0.75rem')).toBe('12px');
    expect(toEmailPx('9999px')).toBe('9999px');
  });

  test('renders tokenized email primitives with Stone theme styles', async () => {
    const html = await render(
      <Document lang="en" title="Order Confirmation" preview="Order #42 confirmed">
        <Card>
          <Section spacing="lg">
            <Eyebrow>Acme Books</Eyebrow>
            <Heading as="h1">Thank you</Heading>
            <Heading as="h2">Order summary</Heading>
          </Section>
          <Text tone="secondary" spacing="md">
            Your order is ready.
          </Text>
          <Callout tone="muted">
            <Text tone="primary" size="sm">
              Item 1
            </Text>
          </Callout>
          <Callout tone="info">
            <Text tone="info" size="sm">
              Processing
            </Text>
          </Callout>
          <Callout tone="success">
            <Text tone="success" size="sm">
              Paid
            </Text>
          </Callout>
          <Callout tone="warning">
            <Row>
              <Column>
                <Text tone="warning" size="sm" weight="semibold">
                  SKU-1
                </Text>
              </Column>
              <Column align="right">
                <Text tone="primary" size="sm">
                  2 left
                </Text>
              </Column>
            </Row>
          </Callout>
          <Callout tone="error">
            <Text tone="error" size="sm">
              Action required
            </Text>
          </Callout>
          <Divider tone="strong" spacing="md" />
          <Section spacing="md">
            <Button href="https://example.com/order/42">View Order</Button>
            <Button href="https://example.com/help" variant="secondary">
              Help
            </Button>
            <Button href="https://example.com/cancel" variant="destructive">
              Cancel
            </Button>
          </Section>
          <Text tone="muted" size="xs" breakAll>
            <Link href="https://example.com/order/42">https://example.com/order/42</Link>
          </Text>
        </Card>
      </Document>,
    );

    expect(html).toContain(starterLightTokens.colors.canvas);
    expect(html).toContain(starterLightTokens.colors.surface);
    expect(html).toContain(starterLightTokens.colors.accent);
    expect(html).toContain(starterLightTokens.colors.infoBg);
    expect(html).toContain(starterLightTokens.colors.warningBg);
    expect(html).toContain(starterLightTokens.colors.successBg);
    expect(html).toContain(starterLightTokens.colors.errorBg);
    expect(html).toContain('Montserrat');
    expect(html).toContain('Figtree');
    expect(html).toContain('Acme Books');
    expect(html).toContain('View Order');
    expect(html).toContain('Help');
    expect(html).toContain('Cancel');
  });
});
