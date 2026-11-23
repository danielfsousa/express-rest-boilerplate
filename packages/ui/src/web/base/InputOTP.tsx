import { OTPField } from '@base-ui/react/otp-field';
import type { ComponentPropsWithoutRef } from 'react';

export type InputOTPProps = ComponentPropsWithoutRef<typeof OTPField.Root>;
export type InputOTPGroupProps = ComponentPropsWithoutRef<'div'>;
export type InputOTPSlotProps = ComponentPropsWithoutRef<typeof OTPField.Input>;
export type InputOTPSeparatorProps = ComponentPropsWithoutRef<typeof OTPField.Separator>;

function cx(base: string, className: unknown): string {
  return typeof className === 'string' && className.length > 0 ? `${base} ${className}` : base;
}

export function InputOTP({ className, ...props }: InputOTPProps) {
  return <OTPField.Root className={cx('starter-otp', className)} {...props} />;
}

export function InputOTPGroup({ className, ...props }: InputOTPGroupProps) {
  return <div role="group" className={cx('starter-otp-group', className)} {...props} />;
}

export function InputOTPSlot({ className, ...props }: InputOTPSlotProps) {
  return <OTPField.Input className={cx('starter-otp-slot', className)} {...props} />;
}

export function InputOTPSeparator({ className, children, ...props }: InputOTPSeparatorProps) {
  return (
    <OTPField.Separator className={cx('starter-otp-separator', className)} {...props}>
      {children ?? '-'}
    </OTPField.Separator>
  );
}
