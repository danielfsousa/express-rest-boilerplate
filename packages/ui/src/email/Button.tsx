import { Button as ReactEmailButton } from '@react-email/components';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_LINE_HEIGHT, EMAIL_RADII, EMAIL_SPACE, EMAIL_TEXT_SIZE } from './scale.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export interface ButtonProps {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
}

const { colors, typography } = starterLightTokens;

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: colors.accent,
    border: 'none',
    color: colors.onAccent,
  },
  secondary: {
    backgroundColor: colors.surface,
    border: `1.5px solid ${colors.borderStrong}`,
    color: colors.ink,
  },
  destructive: {
    backgroundColor: colors.errorBg,
    border: `1px solid ${colors.errorBorder}`,
    color: colors.errorText,
  },
};

export function Button({ href, variant = 'primary', children }: ButtonProps): ReactElement {
  return (
    <ReactEmailButton
      href={href}
      style={{
        ...VARIANT_STYLES[variant],
        borderRadius: EMAIL_RADII.full,
        boxSizing: 'border-box',
        display: 'inline-block',
        fontFamily: typography.bodyFamily,
        fontSize: EMAIL_TEXT_SIZE.sm,
        fontWeight: '600',
        lineHeight: EMAIL_LINE_HEIGHT.sm,
        padding: `10px ${EMAIL_SPACE.lg}`,
        textAlign: 'center',
        textDecoration: 'none',
      }}
    >
      {children}
    </ReactEmailButton>
  );
}
