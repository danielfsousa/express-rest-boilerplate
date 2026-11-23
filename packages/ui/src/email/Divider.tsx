import { Hr } from '@react-email/components';
import type { ReactElement } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_SPACE } from './scale.ts';
import type { EmailSpacing } from './scale.ts';

export interface DividerProps {
  tone?: 'subtle' | 'strong';
  spacing?: EmailSpacing;
}

const { colors } = starterLightTokens;

export function Divider({ tone = 'subtle', spacing = 'md' }: DividerProps): ReactElement {
  return (
    <Hr
      style={{
        borderColor: tone === 'strong' ? colors.borderStrong : colors.border,
        margin: `${EMAIL_SPACE[spacing]} ${EMAIL_SPACE.none}`,
      }}
    />
  );
}
