import { render } from '@react-email/render';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';
import type {
  BirdTemplateDefinition,
  BirdTemplateLanguagePayload,
  EmailTemplateSlug,
} from './template-catalog.ts';

export interface RenderedEmail {
  html: string;
  text: string;
}

export interface CompiledLanguageInput<TProps> {
  subject: string;
  previewText: string;
  props: TProps;
}

export interface DefineEmailTemplateInput<TProps> {
  slug: EmailTemplateSlug;
  name: string;
  description: string;
  category?: 'transactional';
  defaultLanguage?: Locale;
  component: (props: TProps) => ReactElement;
  compileLanguage: (locale: Locale) => CompiledLanguageInput<TProps>;
}

export interface RegisteredEmailTemplate {
  readonly slug: EmailTemplateSlug;
  readonly name: string;
  readonly description: string;
  readonly category: 'transactional';
  readonly defaultLanguage: Locale;
  compile: () => Promise<BirdTemplateDefinition>;
}

export interface EmailTemplateHandle<TProps> extends RegisteredEmailTemplate {
  readonly component: (props: TProps) => ReactElement;
  render: (props: TProps) => Promise<RenderedEmail>;
}

const registeredTemplates = new Map<EmailTemplateSlug, RegisteredEmailTemplate>();

function normalizeLiquidHtml(html: string): string {
  return html.replaceAll('%7B%7B', '{{').replaceAll('%7D%7D', '}}');
}

export async function renderEmail(element: ReactElement): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}

export function defineTemplate<TProps>(
  input: DefineEmailTemplateInput<TProps>,
): EmailTemplateHandle<TProps> {
  const category = input.category ?? 'transactional';
  const defaultLanguage = input.defaultLanguage ?? 'en';

  async function renderTemplate(props: TProps): Promise<RenderedEmail> {
    return renderEmail(input.component(props));
  }

  async function buildLanguage(locale: Locale): Promise<BirdTemplateLanguagePayload> {
    const compiled = input.compileLanguage(locale);
    const rendered = await renderTemplate(compiled.props);
    return {
      subject: compiled.subject,
      preview_text: compiled.previewText,
      html: normalizeLiquidHtml(rendered.html),
      text: rendered.text,
    };
  }

  const handle: EmailTemplateHandle<TProps> = {
    slug: input.slug,
    name: input.name,
    description: input.description,
    category,
    defaultLanguage,
    component: input.component,
    render: renderTemplate,
    async compile(): Promise<BirdTemplateDefinition> {
      const [en, ptBr] = await Promise.all([buildLanguage('en'), buildLanguage('pt-BR')]);
      return {
        slug: input.slug,
        name: input.name,
        description: input.description,
        category,
        defaultLanguage,
        languages: {
          en,
          'pt-BR': ptBr,
        },
      };
    },
  };

  registeredTemplates.set(input.slug, handle);
  return handle;
}

export function getRegisteredTemplates(): ReadonlyArray<RegisteredEmailTemplate> {
  return [...registeredTemplates.values()];
}

export function compileBirdEmailTemplates(): Promise<Array<BirdTemplateDefinition>> {
  return Promise.all([...registeredTemplates.values()].map((template) => template.compile()));
}
