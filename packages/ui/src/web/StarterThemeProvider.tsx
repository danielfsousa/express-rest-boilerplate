import { Theme } from '@astryxdesign/core/theme';
import type { ReactNode } from 'react';
import { stoneTheme } from '../theme.ts';

export interface StarterThemeProviderProps {
  mode?: 'system' | 'light' | 'dark';
  children: ReactNode;
}

/** Wraps an application subtree in the official Astryx Stone theme. */
export function StarterThemeProvider({ mode = 'system', children }: StarterThemeProviderProps) {
  return (
    <Theme theme={stoneTheme} mode={mode}>
      {children}
    </Theme>
  );
}
