import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fieldset, FieldsetDescription, FieldsetLegend, TextInput, VStack } from '../index.ts';

const meta: Meta<typeof Fieldset> = {
  title: 'Base UI/Fieldset',
  component: Fieldset,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables the fieldset and dims grouped controls.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Fieldset>;

export const BillingDetails: Story = {
  args: { disabled: false },
  render: (args) => (
    <VStack maxWidth={440}>
      <Fieldset {...args}>
        <FieldsetLegend>Storefront Identity</FieldsetLegend>
        <FieldsetDescription>
          Shown on customer receipts, order trackers, and transactional emails.
        </FieldsetDescription>
        <TextInput label="Store name" value="Acme Books" onChange={() => {}} />
        <TextInput label="Support email" type="email" value="hello@acme.test" onChange={() => {}} />
      </Fieldset>
    </VStack>
  ),
};

export const DisabledFieldset: Story = {
  args: { disabled: true },
  render: (args) => (
    <VStack maxWidth={440}>
      <Fieldset {...args}>
        <FieldsetLegend>Archived Storefront</FieldsetLegend>
        <FieldsetDescription>
          Archived stores are read-only until reactivated by an administrator.
        </FieldsetDescription>
        <TextInput label="Store slug" value="acme-legacy" onChange={() => {}} isDisabled />
      </Fieldset>
    </VStack>
  ),
};
