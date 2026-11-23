import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, DataRow, StatusPill } from './index.ts';

const meta: Meta<typeof DataRow> = {
  title: 'Web/DataRow',
  component: DataRow,
  tags: ['autodocs'],
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
