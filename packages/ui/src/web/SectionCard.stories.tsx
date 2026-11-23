import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, SectionCard, StatusPill, Text } from './index.ts';

const meta: Meta<typeof SectionCard> = {
  title: 'Web/SectionCard',
  component: SectionCard,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SectionCard>;

export const Default: Story = {
  args: {
    title: 'Order #ord-42',
    description: 'Customer: Ada Lovelace (ada@example.com)',
    headerActions: <StatusPill tone="success" label="fulfilled" />,
    children: <Text>2 items · Total: $39.98</Text>,
  },
};

export const WithAction: Story = {
  args: {
    title: 'Catalog Settings',
    description: 'Storefront visibility and inventory thresholds',
    headerActions: <Button label="Save" variant="primary" size="sm" />,
    children: <Text color="secondary">Low-stock alerts trigger below 5 units.</Text>,
  },
};
