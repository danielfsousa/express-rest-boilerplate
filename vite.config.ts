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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'packages/*/src/**/*.ts',
        'packages/*/src/**/*.tsx',
        'apps/api/src/features/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/index.ts',
        'packages/db/src/schema/**',
        'packages/i18n/src/paraglide/**',
        'packages/runtime/src/bun.ts',
        'packages/runtime/src/types.ts',
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
});
