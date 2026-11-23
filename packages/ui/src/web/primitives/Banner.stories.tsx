import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner, Button } from '../index.ts';

const meta: Meta<typeof Banner> = {
  title: 'Primitives/Banner',
  component: Banner,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['info', 'warning', 'error', 'success'],
    },
    container: {
      control: 'select',
      options: ['card', 'section'],
    },
    elevation: {
      control: 'inline-radio',
      options: ['none', 'low', 'med', 'high'],
    },
    isDismissable: { control: 'boolean' },
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

export const Dismissable: Story = {
  args: {
    status: 'info',
    title: 'Storefront is live',
    isDismissable: true,
  },
};
