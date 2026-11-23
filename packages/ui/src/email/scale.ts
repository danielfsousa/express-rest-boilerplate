import { starterLightTokens } from '../tokens.ts';

export const EMAIL_CONTAINER_MAX_WIDTH = '560px';

export const EMAIL_SPACE = {
  none: '0',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
} as const;

export const EMAIL_TEXT_SIZE = {
  xs: '12px',
  sm: '14px',
  md: '15px',
} as const;

export const EMAIL_LINE_HEIGHT = {
  xs: '18px',
  sm: '20px',
  md: '24px',
} as const;

/**
 * Convert CSS rem tokens from Astryx Stone into integer pixel strings so
 * email clients (Outlook, Gmail) render corners consistently without rem support.
 */
export function toEmailPx(cssLength: string): string {
  const trimmed = cssLength.trim();
  if (trimmed.endsWith('rem')) {
    const rem = Number.parseFloat(trimmed.slice(0, -3));
    return `${String(Math.round(rem * 16))}px`;
  }
  return trimmed;
}

export const EMAIL_RADII = {
  inner: toEmailPx(starterLightTokens.radii.inner),
  element: toEmailPx(starterLightTokens.radii.element),
  container: toEmailPx(starterLightTokens.radii.container),
  full: toEmailPx(starterLightTokens.radii.full),
} as const;

export type EmailSpacing = keyof typeof EMAIL_SPACE;
export type EmailTextSize = keyof typeof EMAIL_TEXT_SIZE;
