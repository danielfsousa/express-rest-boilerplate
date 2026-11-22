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
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts', 'apps/*/test/**/*.test.ts'],
  },
});
