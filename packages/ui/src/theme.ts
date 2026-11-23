import { defineTheme } from '@astryxdesign/core/theme';
import { stoneTheme } from '@astryxdesign/theme-stone';

/**
 * Starter design system theme extending Astryx Stone with monochrome
 * stone surfaces, high-contrast ink, and forest-green positive accents.
 */
export const starterTheme = defineTheme({
  name: 'starter-stone',
  extends: stoneTheme,
  tokens: {
    '--color-background-body': ['#FAFAFA', '#111110'],
    '--color-background-surface': ['#FFFFFF', '#191918'],
    '--color-background-card': ['#FFFFFF', '#191918'],
    '--color-background-popover': ['#FFFFFF', '#222220'],
    '--color-background-muted': ['#F3F3F2', '#262624'],
    '--color-background-inverted': ['#171717', '#FAFAFA'],
    '--color-text-primary': ['#171717', '#F5F5F4'],
    '--color-text-secondary': ['#4D4D4D', '#B5B5B0'],
    '--color-text-disabled': ['#7D7D7D', '#787873'],
    '--color-accent': ['#171717', '#F5F5F4'],
    '--color-on-accent': ['#FFFFFF', '#171717'],
    '--color-text-accent': ['#171717', '#F5F5F4'],
    '--color-icon-accent': ['#171717', '#F5F5F4'],
    '--color-border': ['#EBEBEB', '#2E2E2B'],
    '--color-border-emphasized': ['#C9C9C9', '#454540'],
    '--color-success': ['#297A3A', '#4ADE80'],
    '--color-on-success': ['#FFFFFF', '#0B2412'],
    '--color-text-success': ['#1F5E2C', '#86EFAC'],
    '--color-border-success': ['#297A3A', '#4ADE80'],
    '--color-background-green': ['#EAF5EC', '#14331C'],
    '--color-warning': ['#B45309', '#FBBF24'],
    '--color-text-warning': ['#7C3A06', '#FDE68A'],
    '--color-border-warning': ['#D97706', '#F59E0B'],
    '--color-background-yellow': ['#FEF6E7', '#33250B'],
    '--color-error': ['#C81E1E', '#F87171'],
    '--color-text-error': ['#991B1B', '#FCA5A5'],
    '--color-border-error': ['#DC2626', '#F87171'],
    '--color-background-red': ['#FEECEC', '#361414'],
  },
});
