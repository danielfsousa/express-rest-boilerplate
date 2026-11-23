import { Hr } from '@react-email/components';
import type { ReactElement } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_SPACE } from './scale.ts';
import type { EmailSpacing } from './scale.ts';

export interface DividerProps {
  tone?: 'subtle' | 'strong';
  spacing?: EmailSpacing;
}

const { colors, borders } = starterLightTokens;

export function Divider({ tone = 'subtle', spacing = 'md' }: DividerProps): ReactElement {
  return (
    <Hr
      style={{
        border: 'none',
        borderTop: `${borders.width} solid ${tone === 'strong' ? colors.borderStrong : colors.border}`,
        height: '0',
        margin: `${EMAIL_SPACE[spacing]} ${EMAIL_SPACE.none}`,
      }}
    />
  );
}
