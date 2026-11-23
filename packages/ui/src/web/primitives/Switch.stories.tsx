import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from '../index.ts';

function ControlledSwitch({
  label,
  description,
  initialValue = true,
  isDisabled = false,
  isLoading = false,
}: {
  label: string;
  description?: string;
  initialValue?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
}) {
  const [checked, setChecked] = useState(initialValue);
  return (
    <Switch
      label={label}
      value={checked}
      onChange={setChecked}
      isDisabled={isDisabled}
      isLoading={isLoading}
      {...(description !== undefined ? { description } : {})}
    />
  );
}

const meta: Meta<typeof ControlledSwitch> = {
  title: 'Primitives/Switch',
  component: ControlledSwitch,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ControlledSwitch>;

export const Interactive: Story = {
  args: { label: 'Published on storefront', initialValue: true },
};

export const WithDescription: Story = {
  args: {
    label: 'Email alerts',
    description: 'Notify owners when stock drops below threshold.',
    initialValue: true,
  },
};

export const Disabled: Story = {
  args: { label: 'Read-only setting', initialValue: false, isDisabled: true },
};

export const Loading: Story = {
  args: { label: 'Updating status', initialValue: true, isLoading: true },
};
