import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, VStack } from '../index.ts';

const meta: Meta<typeof Accordion> = {
  title: 'Base UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    multiple: {
      control: 'boolean',
      description: 'Allows more than one item to stay open simultaneously.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables keyboard and pointer toggling for all items.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  args: { multiple: false },
  render: (args) => (
    <VStack maxWidth={520}>
      <Accordion {...args} defaultValue={['shipping']}>
        <AccordionItem value="shipping">
          <AccordionTrigger>How fast do book orders ship?</AccordionTrigger>
          <AccordionContent>
            Orders placed before 2:00 PM ship the same business day with live webhook tracking.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger>What is the merchant return policy?</AccordionTrigger>
          <AccordionContent>
            Store owners can issue full or partial refunds from the order dashboard within 30 days.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="alerts">
          <AccordionTrigger>When do low-stock email alerts fire?</AccordionTrigger>
          <AccordionContent>
            Low-stock alerts trigger automatically whenever remaining inventory drops below 5
            copies.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </VStack>
  ),
};

export const MultipleAndDisabled: Story = {
  args: { multiple: true },
  parameters: {
    docs: {
      description: {
        story: 'Multiple panels expanded at once, plus an individually disabled item.',
      },
    },
  },
  render: () => (
    <VStack maxWidth={520}>
      <Accordion multiple defaultValue={['api', 'storage']}>
        <AccordionItem value="api">
          <AccordionTrigger>API Runtime</AccordionTrigger>
          <AccordionContent>
            Hono REST and WebSocket endpoints run on Node.js with row-level security.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="storage">
          <AccordionTrigger>Object Storage</AccordionTrigger>
          <AccordionContent>
            Cover uploads and CSV exports store objects in S3-compatible Floci or Cloudflare R2.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="enterprise" disabled>
          <AccordionTrigger>Dedicated Cluster (Enterprise plan)</AccordionTrigger>
          <AccordionContent>Unavailable on the Starter plan.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </VStack>
  ),
};
