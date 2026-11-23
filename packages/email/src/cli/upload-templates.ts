import 'varlock/auto-load';
import { createLogger } from '@starter/runtime';
import { ENV } from 'varlock/env';
import { createBirdClient } from '../mailer.ts';
import { syncBirdTemplates } from '../sync-templates.ts';
import { compileBirdEmailTemplates } from '@starter/email/templates';

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const validateOnly = args.has('--validate-only');
  const logger = createLogger({ level: ENV.LOG_LEVEL, format: ENV.LOG_FORMAT });

  const templates = await compileBirdEmailTemplates();
  for (const tpl of templates) {
    for (const [language, content] of Object.entries(tpl.languages)) {
      if (!content.subject || !content.html || !content.text) {
        throw new Error(`Template ${tpl.slug} (${language}) compiled with empty content`);
      }
    }
  }

  if (dryRun) {
    logger.info(
      {
        count: templates.length,
        slugs: templates.map((t) => t.slug).join(', '),
      },
      'Compiled and verified React JSX email templates (dry-run)',
    );
    return;
  }

  const client = createBirdClient({
    apiKey: ENV.BIRD_API_KEY,
    apiBaseUrl: ENV.BIRD_API_BASE_URL,
  });

  const results = await syncBirdTemplates({
    client,
    templates,
    validateOnly,
    logger,
  });

  logger.info(
    {
      count: results.length,
      summary: results.map((r) => `${r.slug}:${r.action}`).join(', '),
    },
    'Completed Bird email template sync',
  );
}

await main();
