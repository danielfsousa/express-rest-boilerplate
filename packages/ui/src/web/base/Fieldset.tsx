import { Fieldset as FieldsetPrimitive } from '@base-ui/react/fieldset';
import type { ComponentPropsWithoutRef } from 'react';

export type FieldsetProps = ComponentPropsWithoutRef<typeof FieldsetPrimitive.Root>;
export type FieldsetLegendProps = ComponentPropsWithoutRef<typeof FieldsetPrimitive.Legend>;
export type FieldsetDescriptionProps = ComponentPropsWithoutRef<'p'>;

function cx(base: string, className: unknown): string {
  return typeof className === 'string' && className.length > 0 ? `${base} ${className}` : base;
}

export function Fieldset({ className, ...props }: FieldsetProps) {
  return <FieldsetPrimitive.Root className={cx('starter-fieldset', className)} {...props} />;
}

export function FieldsetLegend({ className, ...props }: FieldsetLegendProps) {
  return (
    <FieldsetPrimitive.Legend className={cx('starter-fieldset-legend', className)} {...props} />
  );
}

export function FieldsetDescription({ className, ...props }: FieldsetDescriptionProps) {
  return <p className={cx('starter-fieldset-description', className)} {...props} />;
}
