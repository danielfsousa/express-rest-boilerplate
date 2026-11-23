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

export type EmailSpacing = keyof typeof EMAIL_SPACE;
export type EmailTextSize = keyof typeof EMAIL_TEXT_SIZE;
