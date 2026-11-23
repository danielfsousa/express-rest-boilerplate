import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, ToggleGroup, ToggleGroupItem, VStack } from '../index.ts';

const meta: Meta<typeof ToggleGroup> = {
  title: 'Base UI/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'outline'],
      description: 'Container surface style.',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: 'Button height and padding scale.',
    },
    multiple: {
      control: 'boolean',
      description: 'Allows multiple toggle items to stay pressed.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables all items in the group.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const SingleSelection: Story = {
  args: { variant: 'default', size: 'md', multiple: false, defaultValue: ['grid'] },
  render: (args) => (
    <ToggleGroup {...args} aria-label="Catalog view">
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="table">Table</ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const VariantsAndSizes: Story = {
  args: { variant: 'outline', size: 'sm' },
  parameters: {
    docs: {
      description: {
        story:
          'Default and outline variants across medium and small sizes, plus multiple selection.',
      },
    },
  },
  render: () => (
    <VStack gap={5}>
      <VStack gap={2}>
        <Text type="label" color="secondary">
          Default · Medium
        </Text>
        <ToggleGroup defaultValue={['all']} aria-label="Order filter">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="paid">Paid</ToggleGroupItem>
          <ToggleGroupItem value="fulfilled">Fulfilled</ToggleGroupItem>
        </ToggleGroup>
      </VStack>
      <VStack gap={2}>
        <Text type="label" color="secondary">
          Outline · Small · Multiple
        </Text>
        <ToggleGroup
          variant="outline"
          size="sm"
          multiple
          defaultValue={['en', 'pt-BR']}
          aria-label="Template locales"
        >
          <ToggleGroupItem value="en">EN</ToggleGroupItem>
          <ToggleGroupItem value="pt-BR">PT-BR</ToggleGroupItem>
          <ToggleGroupItem value="es">ES</ToggleGroupItem>
        </ToggleGroup>
      </VStack>
    </VStack>
  ),
};
