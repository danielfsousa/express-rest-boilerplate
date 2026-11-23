import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-mcp'],
  framework: '@storybook/react-vite',
  features: {
    componentsManifest: true,
  },
  refs: {
    astryx: {
      title: 'Astryx Design System',
      url: 'https://astryx.atmeta.com/storybook',
      expanded: false,
    },
  },
};

export default config;
