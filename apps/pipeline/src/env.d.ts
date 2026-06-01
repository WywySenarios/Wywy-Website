interface ImportMetaEnv {
  readonly PUBLIC_MAIN_URL?: string;
  readonly PUBLIC_DATABASE_URL?: string;
  readonly PUBLIC_CACHE_URL?: string;
  readonly CACHE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
