import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextInput } from '../index.ts';

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
};

export default meta;
type Story = StoryObj<typeof ControlledTextInput>;

export const Interactive: Story = {
  args: { label: 'Book title', initialValue: 'Designing Data-Intensive Applications' },
};

export const Email: Story = {
  args: { label: 'Customer email', type: 'email', description: 'Receipts are sent here.' },
};

export const Search: Story = {
  args: { label: 'Search catalog', type: 'search' },
};

export const Required: Story = {
  args: { label: 'SKU', isRequired: true },
};

export const Disabled: Story = {
  args: { label: 'Store slug', initialValue: 'default', isDisabled: true },
};
