import { Body, Font, Head, Html, Preview } from '@react-email/components';
import type { ReactElement, ReactNode } from 'react';
import { starterLightTokens } from '../tokens.ts';
import { EMAIL_SPACE } from './scale.ts';

export interface DocumentProps {
  lang: string;
  title: string;
  preview: string;
  children: ReactNode;
}

const { colors, typography } = starterLightTokens;

export function Document({ lang, title, preview, children }: DocumentProps): ReactElement {
  return (
    <Html lang={lang}>
      <Head>
        <title>{title}</title>
        <Font
          fontFamily="Montserrat"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aXo.woff2',
            format: 'woff2',
          }}
          fontWeight={600}
          fontStyle="normal"
        />
        <Font
          fontFamily="Figtree"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/figtree/v5/_Xmz-HUzqDCFdgfMsYiV_F7wfS-Bs_d_QG5ZyEA2.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          WebkitFontSmoothing: 'antialiased',
          backgroundColor: colors.canvas,
          color: colors.ink,
          fontFamily: typography.bodyFamily,
          margin: EMAIL_SPACE.none,
          padding: `${EMAIL_SPACE['2xl']} ${EMAIL_SPACE.md}`,
        }}
      >
        {children}
      </Body>
    </Html>
  );
}
