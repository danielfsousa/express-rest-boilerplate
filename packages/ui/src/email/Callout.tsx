import { Section } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_SPACE } from './scale.ts';

export type CalloutTone = 'muted' | 'success' | 'warning' | 'error';

export interface CalloutProps {
  tone?: CalloutTone;
  children: ReactNode;
}

const { colors, radii, borders } = starterLightTokens;

const TONE_SURFACE: Record<CalloutTone, { background: string; border: string }> = {
  muted: { background: colors.mutedSurface, border: colors.border },
  success: { background: colors.successBg, border: colors.success },
  warning: { background: colors.warningBg, border: colors.warning },
  error: { background: colors.errorBg, border: colors.error },
};

export function Callout({ tone = 'muted', children }: CalloutProps): ReactElement {
  const palette = TONE_SURFACE[tone];

  return (
    <Section
      style={{
        backgroundColor: palette.background,
        border: `${borders.width} solid ${palette.border}`,
        borderRadius: radii.element,
        padding: EMAIL_SPACE.md,
      }}
    >
      {children}
    </Section>
  );
}
