import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, DataRow, Divider, SectionCard, StatusPill, VStack } from './index.ts';

const meta: Meta<typeof DataRow> = {
  title: 'Web/DataRow',
  component: DataRow,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Primary entity title.' },
    subtitle: { control: 'text', description: 'Secondary metadata summary.' },
    status: { control: false, description: 'Optional StatusPill slot next to the title.' },
    actions: { control: false, description: 'Trailing action buttons.' },
  },
};

export default meta;

type Story = StoryObj<typeof DataRow>;

export const PublishedBook: Story = {
  args: {
    title: 'Designing Data-Intensive Applications (SKU-DDIA)',
    subtitle: 'Martin Kleppmann · $39.00 · Stock: 14',
    status: <StatusPill tone="success" label="Published" />,
    actions: (
      <>
        <Button label="Unpublish" variant="secondary" size="sm" />
        <Button label="Delete" variant="destructive" size="sm" />
      </>
    ),
  },
};

export const DraftBook: Story = {
  args: {
    title: 'Systems Performance (SKU-SP)',
    subtitle: 'Brendan Gregg · $49.00 · Stock: 3',
    status: <StatusPill tone="neutral" label="Draft" />,
    actions: <Button label="Publish" variant="primary" size="sm" />,
  },
};

export const CatalogList: Story = {
  args: {
    title: 'Catalog row',
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple DataRow entries separated by dividers inside a SectionCard.',
      },
    },
  },
  render: () => (
    <SectionCard title="Catalog (2)" description="Manage storefront visibility and stock">
      <VStack gap={4}>
        <DataRow
          title="Designing Data-Intensive Applications (SKU-DDIA)"
          subtitle="Martin Kleppmann · $39.00 · Stock: 14"
          status={<StatusPill tone="success" label="Published" />}
          actions={
            <>
              <Button label="Unpublish" variant="secondary" size="sm" />
              <Button label="Delete" variant="destructive" size="sm" />
            </>
          }
        />
        <Divider />
        <DataRow
          title="Systems Performance (SKU-SP)"
          subtitle="Brendan Gregg · $49.00 · Stock: 3"
          status={<StatusPill tone="warning" label="Low stock" />}
          actions={<Button label="Publish" variant="primary" size="sm" />}
        />
      </VStack>
    </SectionCard>
  ),
};
