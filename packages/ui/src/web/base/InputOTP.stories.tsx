import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Text,
  VStack,
} from '../index.ts';

const meta: Meta<typeof InputOTP> = {
  title: 'Base UI/InputOTP',
  component: InputOTP,
  tags: ['autodocs'],
  argTypes: {
    length: {
      control: { type: 'number', min: 4, max: 8 },
      description: 'Number of one-time-passcode character slots.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables user input across all slots.',
    },
    mask: {
      control: 'boolean',
      description: 'Masks entered digits.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InputOTP>;

export const SixDigit: Story = {
  args: { length: 6, defaultValue: '428' },
  render: (args) => (
    <VStack gap={2}>
      <Text type="label">Verification code</Text>
      <InputOTP {...args} aria-label="Verification code">
        <InputOTPGroup>
          <InputOTPSlot />
          <InputOTPSlot />
          <InputOTPSlot />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot />
          <InputOTPSlot />
          <InputOTPSlot />
        </InputOTPGroup>
      </InputOTP>
    </VStack>
  ),
};

export const Disabled: Story = {
  args: { length: 4, defaultValue: '9104', disabled: true },
  render: (args) => (
    <InputOTP {...args} aria-label="Locked verification code">
      <InputOTPGroup>
        <InputOTPSlot />
        <InputOTPSlot />
        <InputOTPSlot />
        <InputOTPSlot />
      </InputOTPGroup>
    </InputOTP>
  ),
};
