import { Link as ReactEmailLink } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';

export interface LinkProps {
  href: string;
  children: ReactNode;
}

const { colors } = starterLightTokens;

export function Link({ href, children }: LinkProps): ReactElement {
  return (
    <ReactEmailLink
      href={href}
      style={{
        color: colors.inkSecondary,
        textDecoration: 'underline',
      }}
    >
      {children}
    </ReactEmailLink>
  );
}
