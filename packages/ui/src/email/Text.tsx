import { Text as ReactEmailText } from '@react-email/components';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_LINE_HEIGHT, EMAIL_SPACE, EMAIL_TEXT_SIZE } from './scale.ts';
import type { EmailSpacing, EmailTextSize } from './scale.ts';

export type TextTone = 'primary' | 'secondary' | 'muted' | 'info' | 'success' | 'warning' | 'error';

export interface TextProps {
  tone?: TextTone;
  size?: EmailTextSize;
  weight?: 'normal' | 'semibold';
  spacing?: EmailSpacing;
  breakAll?: boolean;
  children: ReactNode;
}

const { colors, typography } = starterLightTokens;

const TONE_COLOR: Record<TextTone, string> = {
  primary: colors.ink,
  secondary: colors.inkSecondary,
  muted: colors.inkMuted,
  info: colors.infoText,
  success: colors.successText,
  warning: colors.warningText,
  error: colors.errorText,
};

export function Text({
  tone = 'secondary',
  size = 'md',
  weight = 'normal',
  spacing = 'none',
  breakAll = false,
  children,
}: TextProps): ReactElement {
  const style: CSSProperties = {
    color: TONE_COLOR[tone],
    fontFamily: typography.bodyFamily,
    fontSize: EMAIL_TEXT_SIZE[size],
    fontWeight: weight === 'semibold' ? '600' : '400',
    lineHeight: EMAIL_LINE_HEIGHT[size],
    margin: `${EMAIL_SPACE.none} ${EMAIL_SPACE.none} ${EMAIL_SPACE[spacing]} ${EMAIL_SPACE.none}`,
  };
  if (breakAll) {
    style.wordBreak = 'break-all';
  }

  return <ReactEmailText style={style}>{children}</ReactEmailText>;
}
