import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextArea, VStack } from '../index.ts';

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
  argTypes: {
    label: { control: 'text', description: 'Field label.' },
    description: { control: 'text', description: 'Optional helper text.' },
    isRequired: { control: 'boolean', description: 'Marks the field required.' },
    isDisabled: { control: 'boolean', description: 'Disables editing.' },
  },
};

export default meta;
type Story = StoryObj<typeof ControlledTextArea>;

export const Interactive: Story = {
  args: {
    label: 'Book synopsis',
    initialValue: 'A practical guide to reliable, scalable, and maintainable data systems.',
  },
};

export const AllStates: Story = {
  args: { label: 'Book synopsis' },
  render: () => (
    <VStack gap={4} maxWidth={480}>
      <ControlledTextArea
        label="Book synopsis"
        initialValue="A practical guide to reliable, scalable, and maintainable data systems."
      />
      <ControlledTextArea
        label="Storefront announcement"
        description="Shown at the top of the storefront catalog page."
        isRequired
      />
      <ControlledTextArea
        label="Archived notes"
        initialValue="Read-only historical record."
        isDisabled
      />
    </VStack>
  ),
};
