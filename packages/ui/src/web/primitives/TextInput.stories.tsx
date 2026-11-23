import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextInput, VStack } from '../index.ts';

function ControlledTextInput({
  label,
  type = 'text',
  description,
  initialValue = '',
  isRequired = false,
  isDisabled = false,
}: {
  label: string;
  type?: 'text' | 'email' | 'search' | 'password';
  description?: string;
  initialValue?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <TextInput
      label={label}
      type={type}
      value={value}
      onChange={setValue}
      isRequired={isRequired}
      isDisabled={isDisabled}
      {...(description !== undefined ? { description } : {})}
    />
  );
}

const meta: Meta<typeof ControlledTextInput> = {
  title: 'Primitives/TextInput',
  component: ControlledTextInput,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Field label.' },
    type: {
      control: 'select',
      options: ['text', 'email', 'search', 'password'],
      description: 'HTML input type.',
    },
    description: { control: 'text', description: 'Optional helper text.' },
    isRequired: { control: 'boolean', description: 'Marks the field required.' },
    isDisabled: { control: 'boolean', description: 'Disables editing.' },
  },
};

export default meta;
type Story = StoryObj<typeof ControlledTextInput>;

export const Interactive: Story = {
  args: { label: 'Book title', initialValue: 'Designing Data-Intensive Applications' },
};

export const AllStates: Story = {
  args: { label: 'Book title' },
  render: () => (
    <VStack gap={4} maxWidth={420}>
      <ControlledTextInput
        label="Book title"
        initialValue="Designing Data-Intensive Applications"
      />
      <ControlledTextInput
        label="Customer email"
        type="email"
        description="Order receipts are sent to this address."
        isRequired
      />
      <ControlledTextInput label="Search catalog" type="search" />
      <ControlledTextInput label="Store slug" initialValue="acme-books" isDisabled />
    </VStack>
  ),
};
