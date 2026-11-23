import { Button as ReactEmailButton } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_LINE_HEIGHT, EMAIL_SPACE, EMAIL_TEXT_SIZE } from './scale.ts';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
}

const { colors, radii, borders } = starterLightTokens;

export function Button({ href, variant = 'primary', children }: ButtonProps): ReactElement {
  const isPrimary = variant === 'primary';

  return (
    <ReactEmailButton
      href={href}
      style={{
        backgroundColor: isPrimary ? colors.accent : colors.surface,
        border: isPrimary ? 'none' : `${borders.width} solid ${colors.borderStrong}`,
        borderRadius: radii.element,
        color: isPrimary ? colors.onAccent : colors.ink,
        display: 'inline-block',
        fontSize: EMAIL_TEXT_SIZE.sm,
        fontWeight: '600',
        lineHeight: EMAIL_LINE_HEIGHT.sm,
        padding: `${EMAIL_SPACE.sm} ${EMAIL_SPACE.lg}`,
        textDecoration: 'none',
      }}
    >
      {children}
    </ReactEmailButton>
  );
}
