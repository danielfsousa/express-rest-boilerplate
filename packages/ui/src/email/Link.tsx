import { Link as ReactEmailLink } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';

export interface LinkProps {
  href: string;
  children: ReactNode;
}

const { colors, typography } = starterLightTokens;

export function Link({ href, children }: LinkProps): ReactElement {
  return (
    <ReactEmailLink
      href={href}
      style={{
        color: colors.ink,
        fontFamily: typography.bodyFamily,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      }}
    >
      {children}
    </ReactEmailLink>
  );
}
