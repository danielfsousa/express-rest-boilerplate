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
} from './index.ts';

describe('@starter/ui/email', () => {
  test('renders tokenized email primitives with @starter/ui/tokens styles', async () => {
    const html = await render(
      <Document lang="en" title="Order Confirmation" preview="Order #42 confirmed">
        <Card>
          <Section spacing="lg">
            <Eyebrow>Acme Books</Eyebrow>
            <Heading as="h1">Thank you</Heading>
          </Section>
          <Text tone="secondary" spacing="md">
            Your order is ready.
          </Text>
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
          <Divider spacing="md" />
          <Section spacing="md">
            <Button href="https://example.com/order/42">View Order</Button>
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
    expect(html).toContain(starterLightTokens.colors.warningBg);
    expect(html).toContain('Acme Books');
    expect(html).toContain('View Order');
  });
});
