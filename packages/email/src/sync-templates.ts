import type { BirdClient } from '@messagebird/sdk';
import type { RuntimeLogger } from '@starter/runtime/types';
import type { BirdTemplateDefinition, EmailTemplateSlug } from './template-catalog.ts';

export interface SyncBirdTemplatesOptions {
  client: BirdClient;
  templates: ReadonlyArray<BirdTemplateDefinition>;
  validateOnly?: boolean | undefined;
  logger?: RuntimeLogger | undefined;
}

export interface SyncedBirdTemplateResult {
  slug: EmailTemplateSlug;
  templateId: string;
  action: 'created' | 'updated' | 'validated' | 'unchanged';
  versionNumber?: number | undefined;
}

function getApiStatusCode(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }
  return null;
}

function getApiErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return String(error);
}

export async function syncBirdTemplates({
  client,
  templates,
  validateOnly = false,
  logger,
}: SyncBirdTemplatesOptions): Promise<Array<SyncedBirdTemplateResult>> {
  const results: Array<SyncedBirdTemplateResult> = [];

  for (const templateDef of templates) {
    let templateId: string;
    let draftVersionId: string | undefined;
    let action: SyncedBirdTemplateResult['action'];

    let existingTemplate: Awaited<ReturnType<typeof client.email.templates.get>> | null = null;
    try {
      existingTemplate = await client.email.templates.get(templateDef.slug);
    } catch (error) {
      if (getApiStatusCode(error) !== 404) {
        throw error;
      }
    }

    if (!existingTemplate) {
      const created = await client.email.templates.create({
        slug: templateDef.slug,
        name: templateDef.name,
        description: templateDef.description,
        category: templateDef.category,
        source: 'html',
        default_language: templateDef.defaultLanguage,
        on_missing_language: 'fallback',
        languages: templateDef.languages,
      });
      templateId = created.id;
      draftVersionId = created.draft_version_id ?? undefined;
      action = 'created';
    } else {
      templateId = existingTemplate.id;
      draftVersionId = existingTemplate.draft_version_id ?? undefined;
      if (!draftVersionId) {
        throw new Error(`Bird template "${templateDef.slug}" has no editable draft_version_id`);
      }

      for (const [language, content] of Object.entries(templateDef.languages)) {
        await client.email.templates.versions.languages.set(
          templateId,
          draftVersionId,
          language,
          content,
        );
      }
      action = 'updated';
    }

    if (!draftVersionId) {
      throw new Error(`Bird template "${templateDef.slug}" did not return a draft_version_id`);
    }

    const validation = await client.email.templates.versions.submit(templateId, draftVersionId, {
      validate_only: true,
    });
    if (validation.valid === false) {
      const reasons = (validation.errors ?? [])
        .map((err) => `${err.language ?? 'unknown'}:${err.field ?? 'body'}: ${err.message ?? ''}`)
        .join('; ');
      throw new Error(`Bird template validation failed for "${templateDef.slug}": ${reasons}`);
    }

    if (validateOnly) {
      logger?.info({ slug: templateDef.slug, templateId }, 'Validated Bird email template');
      results.push({ slug: templateDef.slug, templateId, action: 'validated' });
      continue;
    }

    try {
      const published = await client.email.templates.versions.submit(templateId, draftVersionId);
      const versionNumber = published.version?.version_number ?? undefined;
      logger?.info(
        { slug: templateDef.slug, templateId, action, versionNumber },
        'Published Bird email template',
      );
      results.push({ slug: templateDef.slug, templateId, action, versionNumber });
    } catch (error) {
      const status = getApiStatusCode(error);
      const msg = getApiErrorMessage(error).toLowerCase();
      if ((status === 409 || status === 422) && msg.includes('unchanged')) {
        logger?.info(
          { slug: templateDef.slug, templateId },
          'Bird email template draft is unchanged; keeping published version',
        );
        results.push({ slug: templateDef.slug, templateId, action: 'unchanged' });
      } else {
        throw error;
      }
    }
  }

  return results;
}
