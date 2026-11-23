import { EmptyState } from '@astryxdesign/core/EmptyState';
import type { ReactNode } from 'react';

export interface EmptyNoticeProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  isCompact?: boolean;
}

/** Empty-state placeholder wrapped with Starter UI defaults. */
export function EmptyNotice({ title, description, actions, isCompact = false }: EmptyNoticeProps) {
  return (
    <EmptyState
      title={title}
      isCompact={isCompact}
      {...(description !== undefined ? { description } : {})}
      {...(actions !== undefined ? { actions } : {})}
    />
  );
}
