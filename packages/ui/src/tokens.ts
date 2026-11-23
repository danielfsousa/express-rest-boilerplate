import { resolveThemeToken, tokenVar, tokenVars } from '@astryxdesign/core/theme/tokens';
import type { ResolvedThemeMode } from '@astryxdesign/core/theme/tokens';
import { stoneTheme } from '@astryxdesign/theme-stone';

export interface ResolvedDesignTokens {
  colors: {
    canvas: string;
    surface: string;
    mutedSurface: string;
    mutedBorder: string;
    ink: string;
    inkSecondary: string;
    inkMuted: string;
    accent: string;
    onAccent: string;
    border: string;
    borderStrong: string;
    info: string;
    infoBg: string;
    infoBorder: string;
    infoText: string;
    success: string;
    successBg: string;
    successBorder: string;
    successText: string;
    warning: string;
    warningBg: string;
    warningBorder: string;
    warningText: string;
    error: string;
    errorBg: string;
    errorBorder: string;
    errorText: string;
  };
  typography: {
    headingFamily: string;
    bodyFamily: string;
    codeFamily: string;
    heading1Size: string;
    heading2Size: string;
    bodySize: string;
    supportingSize: string;
  };
  radii: {
    inner: string;
    element: string;
    container: string;
    full: string;
  };
  borders: {
    width: string;
  };
}

function token(name: Parameters<typeof resolveThemeToken>[1], mode: ResolvedThemeMode): string {
  return resolveThemeToken(stoneTheme, name, { mode });
}

/**
 * Resolve concrete token values from `stoneTheme` for non-CSS targets
 * such as transactional email templates.
 */
export function resolveStarterTokens(mode: ResolvedThemeMode = 'light'): ResolvedDesignTokens {
  return {
    colors: {
      canvas: token('--color-background-body', mode),
      surface: token('--color-background-surface', mode),
      mutedSurface: token('--color-background-muted', mode),
      mutedBorder: token('--color-border-gray', mode),
      ink: token('--color-text-primary', mode),
      inkSecondary: token('--color-text-secondary', mode),
      inkMuted: token('--color-text-disabled', mode),
      accent: token('--color-accent', mode),
      onAccent: token('--color-on-accent', mode),
      border: token('--color-border', mode),
      borderStrong: token('--color-border-emphasized', mode),
      info: token('--color-info', mode),
      infoBg: token('--color-background-blue', mode),
      infoBorder: token('--color-border-blue', mode),
      infoText: token('--color-text-blue', mode),
      success: token('--color-success', mode),
      successBg: token('--color-background-green', mode),
      successBorder: token('--color-border-green', mode),
      successText: token('--color-text-green', mode),
      warning: token('--color-warning', mode),
      warningBg: token('--color-background-yellow', mode),
      warningBorder: token('--color-border-yellow', mode),
      warningText: token('--color-text-warning', mode),
      error: token('--color-error', mode),
      errorBg: token('--color-background-red', mode),
      errorBorder: token('--color-border-red', mode),
      errorText: token('--color-text-red', mode),
    },
    typography: {
      headingFamily: token('--font-family-heading', mode),
      bodyFamily: token('--font-family-body', mode),
      codeFamily: token('--font-family-code', mode),
      heading1Size: token('--text-heading-1-size', mode),
      heading2Size: token('--text-heading-2-size', mode),
      bodySize: token('--text-body-size', mode),
      supportingSize: token('--text-supporting-size', mode),
    },
    radii: {
      inner: token('--radius-inner', mode),
      element: token('--radius-element', mode),
      container: token('--radius-container', mode),
      full: token('--radius-full', mode),
    },
    borders: {
      width: token('--border-width', mode),
    },
  };
}

export const starterLightTokens: ResolvedDesignTokens = resolveStarterTokens('light');
export const starterDarkTokens: ResolvedDesignTokens = resolveStarterTokens('dark');

export { tokenVar, tokenVars, type ResolvedThemeMode };
