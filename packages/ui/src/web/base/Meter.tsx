import { Meter as MeterPrimitive } from '@base-ui/react/meter';
import type { ComponentPropsWithoutRef } from 'react';

export type MeterTone = 'accent' | 'success' | 'warning' | 'error';

export type MeterProps = ComponentPropsWithoutRef<typeof MeterPrimitive.Root> & {
  tone?: MeterTone;
};
export type MeterLabelProps = ComponentPropsWithoutRef<typeof MeterPrimitive.Label>;
export type MeterValueProps = ComponentPropsWithoutRef<typeof MeterPrimitive.Value>;
export type MeterTrackProps = ComponentPropsWithoutRef<typeof MeterPrimitive.Track>;
export type MeterIndicatorProps = ComponentPropsWithoutRef<typeof MeterPrimitive.Indicator>;

function cx(base: string, className: unknown): string {
  return typeof className === 'string' && className.length > 0 ? `${base} ${className}` : base;
}

export function Meter({ tone = 'accent', className, ...props }: MeterProps) {
  return (
    <MeterPrimitive.Root data-tone={tone} className={cx('starter-meter', className)} {...props} />
  );
}

export function MeterLabel({ className, ...props }: MeterLabelProps) {
  return <MeterPrimitive.Label className={cx('starter-meter-label', className)} {...props} />;
}

export function MeterValue({ className, ...props }: MeterValueProps) {
  return <MeterPrimitive.Value className={cx('starter-meter-value', className)} {...props} />;
}

export function MeterTrack({ className, ...props }: MeterTrackProps) {
  return <MeterPrimitive.Track className={cx('starter-meter-track', className)} {...props} />;
}

export function MeterIndicator({ className, ...props }: MeterIndicatorProps) {
  return (
    <MeterPrimitive.Indicator className={cx('starter-meter-indicator', className)} {...props} />
  );
}
