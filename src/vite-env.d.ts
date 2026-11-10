/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del proyecto de Supabase (https://<ref>.supabase.co). */
  readonly VITE_SUPABASE_URL: string;
  /** Clave pública "anon" de Supabase. Protegida por RLS. */
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
