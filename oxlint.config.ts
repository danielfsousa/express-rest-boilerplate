import cloudflare from '@cloudflare/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
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
    '**/routeTree.gen.ts',
    'packages/i18n/src/paraglide/**',
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
});
