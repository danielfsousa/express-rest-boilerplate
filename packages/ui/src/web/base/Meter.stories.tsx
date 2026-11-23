import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  HStack,
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
  VStack,
} from '../index.ts';

const meta: Meta<typeof Meter> = {
  title: 'Base UI/Meter',
  component: Meter,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Current numeric meter value.',
    },
    min: { control: 'number', description: 'Minimum range bound.' },
    max: { control: 'number', description: 'Maximum range bound.' },
    tone: {
      control: 'select',
      options: ['accent', 'success', 'warning', 'error'],
      description: 'Semantic Stone indicator color.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Meter>;

export const Default: Story = {
  args: { value: 64, min: 0, max: 100, tone: 'accent' },
  render: (args) => (
    <VStack maxWidth={420}>
      <Meter {...args}>
        <HStack justify="between" align="center" className="starter-meter-header">
          <MeterLabel>Catalog storage</MeterLabel>
          <MeterValue />
        </HStack>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>
    </VStack>
  ),
};

export const SemanticTones: Story = {
  args: { value: 75 },
  parameters: {
    docs: {
      description: {
        story:
          'Quota and inventory utilization meters across accent, success, warning, and error tones.',
      },
    },
  },
  render: () => (
    <VStack gap={5} maxWidth={440}>
      <Meter value={42} tone="accent">
        <HStack justify="between" align="center" className="starter-meter-header">
          <MeterLabel>Monthly email quota</MeterLabel>
          <MeterValue />
        </HStack>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>
      <Meter value={88} tone="success">
        <HStack justify="between" align="center" className="starter-meter-header">
          <MeterLabel>Fulfillment SLA</MeterLabel>
          <MeterValue />
        </HStack>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>
      <Meter value={78} tone="warning">
        <HStack justify="between" align="center" className="starter-meter-header">
          <MeterLabel>Warehouse capacity</MeterLabel>
          <MeterValue />
        </HStack>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>
      <Meter value={96} tone="error">
        <HStack justify="between" align="center" className="starter-meter-header">
          <MeterLabel>Rate-limit headroom</MeterLabel>
          <MeterValue />
        </HStack>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>
    </VStack>
  ),
};
