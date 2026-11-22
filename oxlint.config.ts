import cloudflare from '@cloudflare/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  ...cloudflare,
  ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
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
  ],
});
