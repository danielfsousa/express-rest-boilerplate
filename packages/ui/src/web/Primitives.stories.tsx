import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Badge,
  Banner,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Spinner,
  Switch,
  Text,
  TextInput,
  VStack,
} from './index.ts';

function PrimitivesShowcase() {
  const [published, setPublished] = useState(true);
  const [query, setQuery] = useState('');

  return (
    <Card>
      <VStack gap="md">
        <HStack justify="between" align="center">
          <Heading level={2}>Astryx Stone Primitives</Heading>
          <Badge label="v0.7.17" />
        </HStack>
        <Text color="secondary">
          Curated Astryx primitives re-exported by @starter/ui for storefront and console UIs.
        </Text>
        <Divider />
        <HStack gap="sm" align="center">
          <Button label="Primary" variant="primary" size="sm" />
          <Button label="Secondary" variant="secondary" size="sm" />
          <Button label="Ghost" variant="ghost" size="sm" />
          <Button label="Destructive" variant="destructive" size="sm" />
          <Spinner size="sm" />
        </HStack>
        <HStack gap="md" align="center">
          <TextInput
            label="Search catalog"
            value={query}
            onChange={(value) => {
              setQuery(value);
            }}
          />
          <Switch label="Published" value={published} onChange={setPublished} />
        </HStack>
        <Banner
          status="info"
          title="Stone Theme Active"
          description="Monochrome stone surfaces with high-contrast ink."
        />
      </VStack>
    </Card>
  );
}

const meta: Meta<typeof PrimitivesShowcase> = {
  title: 'Web/AstryxPrimitives',
  component: PrimitivesShowcase,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PrimitivesShowcase>;

export const Showcase: Story = {};
