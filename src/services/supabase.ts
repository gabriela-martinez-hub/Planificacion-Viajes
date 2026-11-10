import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Cliente único de Supabase para toda la app (auth, catálogo, RPC).
// Usa la clave pública "anon": todo lo que haga está sujeto a RLS.
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      // La sesión persiste en el navegador y se refresca sola.
      persistSession: true,
      autoRefreshToken: true,
      // Supabase devuelve la sesión en la URL tras el redirect de OAuth.
      detectSessionInUrl: true,
    },
  },
);
