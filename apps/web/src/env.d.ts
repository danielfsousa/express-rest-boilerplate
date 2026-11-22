interface ViteImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_FEATURE_MULTI_TENANCY_ENABLED?: string;
  readonly VITE_FEATURE_I18N_ENABLED?: string;
}

interface ImportMeta {
  readonly env?: ViteImportMetaEnv;
}

declare module '*?url' {
  const url: string;
  export default url;
}
