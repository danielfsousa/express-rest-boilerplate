import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner, Button, VStack } from '../index.ts';

const meta: Meta<typeof Banner> = {
  title: 'Primitives/Banner',
  component: Banner,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['info', 'warning', 'error', 'success'],
      description: 'Semantic alert severity.',
    },
    container: {
      control: 'select',
      options: ['card', 'section'],
      description: 'Surface framing style.',
    },
    elevation: {
      control: 'inline-radio',
      options: ['none', 'low', 'med', 'high'],
      description: 'Resting shadow depth.',
    },
    title: {
      control: 'text',
      description: 'Primary alert headline.',
    },
    description: {
      control: 'text',
      description: 'Optional supporting detail text.',
    },
    isDismissable: {
      control: 'boolean',
      description: 'Displays a close button when true.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Info: Story = {
  args: { status: 'info', title: 'A new catalog update is available.' },
};

export const Warning: Story = {
  args: { status: 'warning', title: 'Your subscription trial expires in 3 days.' },
};

export const Error: Story = {
  args: { status: 'error', title: 'Could not save book changes.' },
};

export const Success: Story = {
  args: { status: 'success', title: 'Store settings saved successfully.' },
};

export const WithDescription: Story = {
  args: {
    status: 'info',
    title: 'Template sync ready',
    description: 'React Email templates are compiled and synced with Bird.',
  },
};

export const WithAction: Story = {
  args: {
    status: 'warning',
    title: 'Impersonating merchant@example.com',
    description: 'Actions you perform run as this user.',
    children: <Button label="Stop impersonating" variant="secondary" size="sm" />,
  },
};

export const AllStatuses: Story = {
  args: { status: 'info', title: 'Status overview' },
  parameters: {
    docs: {
      description: {
        story: 'All four semantic banner statuses stacked with consistent vertical spacing.',
      },
    },
  },
  render: () => (
    <VStack gap={4}>
      <Banner
        status="info"
        title="Template sync ready"
        description="React Email templates are compiled and synced with Bird."
      />
      <Banner
        status="success"
        title="Storefront published"
        description="Customers can now browse your catalog and place orders."
      />
      <Banner
        status="warning"
        title="Impersonating merchant@example.com"
        description="Actions you perform run as this user."
      >
        <Button label="Stop impersonating" variant="secondary" size="sm" />
      </Banner>
      <Banner
        status="error"
        title="Export failed to queue"
        description="Background queue unavailable. Try again in a few moments."
      />
    </VStack>
  ),
};
