import { defineConfig } from 'vite-plus';
import oxlintConfig from './oxlint.config.ts';

export default defineConfig({
  lint: {
    ...oxlintConfig,
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    singleQuote: true,
    semi: true,
  },
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/test/**/*.test.ts',
      'apps/*/src/**/*.test.ts',
      'apps/*/src/**/*.test.tsx',
      'apps/*/test/**/*.test.ts',
    ],
  },
});
