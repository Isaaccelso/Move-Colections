/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly WHATSAPP_NUMBER?: string;
  readonly FORM_TOKEN_SECRET?: string;
  readonly SITE_URL?: string;
  readonly ALLOWED_ORIGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
