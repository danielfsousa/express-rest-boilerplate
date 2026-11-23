import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import type { ComponentPropsWithoutRef } from 'react';

export type ToggleGroupVariant = 'default' | 'outline';
export type ToggleGroupSize = 'sm' | 'md';

export type ToggleGroupProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive> & {
  variant?: ToggleGroupVariant;
  size?: ToggleGroupSize;
};

export type ToggleGroupItemProps = ComponentPropsWithoutRef<typeof Toggle>;

function cx(base: string, className: unknown): string {
  return typeof className === 'string' && className.length > 0 ? `${base} ${className}` : base;
}

export function ToggleGroup({
  variant = 'default',
  size = 'md',
  className,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive
      data-variant={variant}
      data-size={size}
      className={cx('starter-toggle-group', className)}
      {...props}
    />
  );
}

export function ToggleGroupItem({ className, ...props }: ToggleGroupItemProps) {
  return <Toggle className={cx('starter-toggle-item', className)} {...props} />;
}
