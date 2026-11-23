import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type AccordionProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;
export type AccordionItemProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;
export type AccordionTriggerProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>;
export type AccordionContentProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Panel> & {
  children?: ReactNode;
};

function cx(base: string, className: unknown): string {
  return typeof className === 'string' && className.length > 0 ? `${base} ${className}` : base;
}

export function Accordion({ className, ...props }: AccordionProps) {
  return <AccordionPrimitive.Root className={cx('starter-accordion', className)} {...props} />;
}

export function AccordionItem({ className, ...props }: AccordionItemProps) {
  return <AccordionPrimitive.Item className={cx('starter-accordion-item', className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="starter-accordion-header">
      <AccordionPrimitive.Trigger className={cx('starter-accordion-trigger', className)} {...props}>
        <span>{children}</span>
        <ChevronDown aria-hidden className="starter-accordion-chevron" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  return (
    <AccordionPrimitive.Panel className={cx('starter-accordion-panel', className)} {...props}>
      {children}
    </AccordionPrimitive.Panel>
  );
}
