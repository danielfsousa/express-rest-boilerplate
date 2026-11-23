import type { Decorator } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_CONTAINER_MAX_WIDTH, EMAIL_SPACE } from './scale.ts';

const { colors, typography } = starterLightTokens;

export const emailCanvasDecorator: Decorator = (Story) => (
  <section
    style={{
      backgroundColor: colors.canvas,
      color: colors.ink,
      fontFamily: typography.bodyFamily,
      padding: EMAIL_SPACE['2xl'],
    }}
  >
    <div style={{ margin: '0 auto', maxWidth: EMAIL_CONTAINER_MAX_WIDTH }}>
      <Story />
    </div>
  </section>
);

export function EmailStoryStack({ gap = 24, children }: { gap?: number; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${String(gap)}px` }}>
      {children}
    </div>
  );
}

export function EmailStoryGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span
        style={{
          color: colors.inkMuted,
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function EmailStoryRow({ gap = 16, children }: { gap?: number; children: ReactNode }) {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${String(gap)}px`,
      }}
    >
      {children}
    </div>
  );
}
