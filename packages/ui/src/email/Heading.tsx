import { Heading as ReactEmailHeading } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_SPACE } from './scale.ts';

export interface HeadingProps {
  as?: 'h1' | 'h2';
  children: ReactNode;
}

const { colors, typography } = starterLightTokens;

const HEADING_STYLE: Record<'h1' | 'h2', { fontSize: string; lineHeight: string }> = {
  h1: { fontSize: '22px', lineHeight: '30px' },
  h2: { fontSize: '18px', lineHeight: '26px' },
};

export function Heading({ as = 'h1', children }: HeadingProps): ReactElement {
  const size = HEADING_STYLE[as];

  return (
    <ReactEmailHeading
      as={as}
      style={{
        color: colors.ink,
        fontFamily: typography.headingFamily,
        fontSize: size.fontSize,
        fontWeight: '600',
        lineHeight: size.lineHeight,
        margin: EMAIL_SPACE.none,
      }}
    >
      {children}
    </ReactEmailHeading>
  );
}
