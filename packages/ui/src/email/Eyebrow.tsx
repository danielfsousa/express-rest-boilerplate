import { Text as ReactEmailText } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_SPACE, EMAIL_TEXT_SIZE } from './scale.ts';

export interface EyebrowProps {
  children: ReactNode;
}

const { colors } = starterLightTokens;

export function Eyebrow({ children }: EyebrowProps): ReactElement {
  return (
    <ReactEmailText
      style={{
        color: colors.inkMuted,
        fontSize: EMAIL_TEXT_SIZE.xs,
        fontWeight: '600',
        letterSpacing: '0.06em',
        lineHeight: '16px',
        margin: `${EMAIL_SPACE.none} ${EMAIL_SPACE.none} ${EMAIL_SPACE.xs} ${EMAIL_SPACE.none}`,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </ReactEmailText>
  );
}
