import { Theme } from '@astryxdesign/core/theme';
import type { ReactNode } from 'react';
import { starterTheme } from '../theme.ts';

export interface StarterThemeProviderProps {
  mode?: 'system' | 'light' | 'dark';
  children: ReactNode;
}

/** Wraps an application subtree in the Starter Stone Astryx theme. */
export function StarterThemeProvider({ mode = 'system', children }: StarterThemeProviderProps) {
  return (
    <Theme theme={starterTheme} mode={mode}>
      {children}
    </Theme>
  );
}
