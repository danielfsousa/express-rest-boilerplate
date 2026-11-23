import { Container } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_CONTAINER_MAX_WIDTH, EMAIL_SPACE } from './scale.ts';

export interface CardProps {
  children: ReactNode;
}

const { colors, radii, borders } = starterLightTokens;

export function Card({ children }: CardProps): ReactElement {
  return (
    <Container
      style={{
        backgroundColor: colors.surface,
        border: `${borders.width} solid ${colors.border}`,
        borderRadius: radii.container,
        margin: `${EMAIL_SPACE.none} auto`,
        maxWidth: EMAIL_CONTAINER_MAX_WIDTH,
        padding: EMAIL_SPACE['2xl'],
      }}
    >
      {children}
    </Container>
  );
}
