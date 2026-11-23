import {
  Column as ReactEmailColumn,
  Row as ReactEmailRow,
  Section as ReactEmailSection,
} from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { EMAIL_SPACE } from './scale.ts';
import type { EmailSpacing } from './scale.ts';

export interface SectionProps {
  spacing?: EmailSpacing;
  children: ReactNode;
}

export function Section({ spacing = 'none', children }: SectionProps): ReactElement {
  return (
    <ReactEmailSection style={{ marginBottom: EMAIL_SPACE[spacing] }}>{children}</ReactEmailSection>
  );
}

export interface RowProps {
  children: ReactNode;
}

export function Row({ children }: RowProps): ReactElement {
  return <ReactEmailRow>{children}</ReactEmailRow>;
}

export interface ColumnProps {
  align?: 'left' | 'center' | 'right';
  children: ReactNode;
}

export function Column({ align = 'left', children }: ColumnProps): ReactElement {
  return <ReactEmailColumn align={align}>{children}</ReactEmailColumn>;
}
