import cloudflare from '@cloudflare/oxlint-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  defaultPackage: './apps/web',
  staged: {
    '*': 'vp check --fix',
  },
  run: {
    cache: {
      tasks: true,
      scripts: false,
    },
    tasks: {
      'task:check': {
        command: 'vp check',
        cache: {
          input: [{ auto: true }, '!coverage/**', '!playwright-report/**', '!test-results/**'],
          output: [],
        },
      },
      'task:lint': {
        command: 'vp lint',
        cache: {
          input: [{ auto: true }, '!coverage/**', '!playwright-report/**', '!test-results/**'],
          output: [],
        },
      },
      'task:typecheck': {
        command: 'vp check --no-fmt --no-lint',
        cache: {
          input: [{ auto: true }, '!coverage/**', '!playwright-report/**', '!test-results/**'],
          output: [],
        },
      },
    },
  },
  lint: {
    ...cloudflare,
    rules: {
      ...(cloudflare.rules ?? {}),
      'max-params': ['error', { max: 3 }],
    },
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.tanstack/**',
      '**/.output/**',
      '**/storybook-static/**',
      '**/routeTree.gen.ts',
      'packages/i18n/src/paraglide/**',
      'env.d.ts',
    ],
    overrides: [
      ...(cloudflare.overrides ?? []),
      {
        files: ['apps/api/src/**/*.ts'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: ['node:*'],
                  message:
                    'Direct node:* imports are forbidden in apps/api/src/** (ADR-0005). Route runtime capabilities through @starter/runtime.',
                },
              ],
            },
          ],
        },
      },
      {
        files: ['apps/web/src/features/**/*.ts', 'apps/web/src/features/**/*.tsx'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: [
                    '../../*/components/*',
                    '../../*/hooks/*',
                    '../../*/api/*',
                    '../../*/types/*',
                  ],
                  message: 'Cross-feature imports must go through the feature index.ts barrel.',
                },
              ],
            },
          ],
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    singleQuote: true,
    semi: true,
    ignorePatterns: [
      'env.d.ts',
      'packages/i18n/src/paraglide/**',
      '**/routeTree.gen.ts',
      '**/storybook-static/**',
    ],
  },
  test: {
    setupFiles: ['./scripts/vitest-varlock-setup.ts'],
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.tsx',
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
        '**/*.stories.tsx',
        '**/story-frame.tsx',
        '**/index.ts',
        'packages/db/src/schema/**',
        'packages/i18n/src/paraglide/**',
        'packages/runtime/src/bun.ts',
        'packages/runtime/src/types.ts',
        'packages/ui/.storybook/**',
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
});
