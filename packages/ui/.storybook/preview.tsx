import type { Preview } from '@storybook/react-vite';
import { StarterThemeProvider } from '../src/web/StarterThemeProvider.tsx';
import '../src/styles.css';

const preview: Preview = {
  globalTypes: {
    themeMode: {
      name: 'Theme Mode',
      description: 'Color scheme for Starter Stone theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'system', title: 'System' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const rawMode: unknown = context.globals['themeMode'];
      const mode: 'light' | 'dark' | 'system' =
        rawMode === 'dark' || rawMode === 'system' ? rawMode : 'light';
      return (
        <StarterThemeProvider mode={mode}>
          <Story />
        </StarterThemeProvider>
      );
    },
  ],
  parameters: {
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
