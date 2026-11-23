import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextArea } from '../index.ts';

function ControlledTextArea({
  label,
  description,
  initialValue = '',
  isRequired = false,
  isDisabled = false,
}: {
  label: string;
  description?: string;
  initialValue?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <TextArea
      label={label}
      value={value}
      onChange={setValue}
      isRequired={isRequired}
      isDisabled={isDisabled}
      {...(description !== undefined ? { description } : {})}
    />
  );
}

const meta: Meta<typeof ControlledTextArea> = {
  title: 'Primitives/TextArea',
  component: ControlledTextArea,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ControlledTextArea>;

export const Interactive: Story = {
  args: {
    label: 'Book synopsis',
    initialValue: 'A practical guide to reliable, scalable, and maintainable data systems.',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Storefront announcement',
    description: 'Shown at the top of the storefront catalog page.',
  },
};

export const Required: Story = {
  args: {
    label: 'Order notes',
    isRequired: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Archived notes',
    initialValue: 'Read-only historical record.',
    isDisabled: true,
  },
};
