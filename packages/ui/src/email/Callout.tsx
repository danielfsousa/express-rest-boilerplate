import { Section } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_RADII, EMAIL_SPACE } from './scale.ts';

export type CalloutTone = 'muted' | 'info' | 'success' | 'warning' | 'error';

export interface CalloutProps {
  tone?: CalloutTone;
  children: ReactNode;
}

const { colors, borders } = starterLightTokens;

const TONE_SURFACE: Record<CalloutTone, { background: string; border: string }> = {
  muted: { background: colors.mutedSurface, border: colors.mutedBorder },
  info: { background: colors.infoBg, border: colors.infoBorder },
  success: { background: colors.successBg, border: colors.successBorder },
  warning: { background: colors.warningBg, border: colors.warningBorder },
  error: { background: colors.errorBg, border: colors.errorBorder },
};

export function Callout({ tone = 'muted', children }: CalloutProps): ReactElement {
  const palette = TONE_SURFACE[tone];

  return (
    <Section
      style={{
        backgroundColor: palette.background,
        border: `${borders.width} solid ${palette.border}`,
        borderRadius: EMAIL_RADII.element,
        padding: EMAIL_SPACE.md,
      }}
    >
      {children}
    </Section>
  );
}
