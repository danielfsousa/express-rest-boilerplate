import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch, VStack } from '../index.ts';

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
  argTypes: {
    label: { control: 'text', description: 'Primary toggle label.' },
    description: { control: 'text', description: 'Optional helper copy below the label.' },
    initialValue: { control: 'boolean', description: 'Initial checked state.' },
    isDisabled: { control: 'boolean', description: 'Prevents toggling.' },
    isLoading: { control: 'boolean', description: 'Shows a loading indicator while saving.' },
  },
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

export const AllStates: Story = {
  args: { label: 'Store setting' },
  parameters: {
    docs: {
      description: {
        story: 'Interactive, described, disabled, and loading switch states.',
      },
    },
  },
  render: () => (
    <VStack gap={4}>
      <ControlledSwitch label="Published on storefront" initialValue />
      <ControlledSwitch
        label="Low-stock email alerts"
        description="Notify store owners when inventory drops below 5 copies."
        initialValue
      />
      <ControlledSwitch label="Read-only setting" initialValue={false} isDisabled />
      <ControlledSwitch label="Saving preference" initialValue isLoading />
    </VStack>
  ),
};
