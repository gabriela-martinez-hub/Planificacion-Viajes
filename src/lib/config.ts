import { z } from 'zod';

// Variables de entorno del cliente. Solo las VITE_ llegan al navegador
// (la clave service_role nunca lleva ese prefijo; plan.md 5.3).
const esquemaEntorno = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

const resultado = esquemaEntorno.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (!resultado.success) {
  // Error de configuración del despliegue, no del usuario: debe verse en
  // consola y detener el arranque antes de que algo falle de forma confusa.
  const faltantes = resultado.error.issues
    .map((i) => i.path.join('.'))
    .join(', ');
  throw new Error(
    `Faltan o son inválidas las variables de entorno: ${faltantes}. ` +
      'Copia .env.example a .env y complétalo con los valores del proyecto de Supabase.',
  );
}

export const config = {
  supabaseUrl: resultado.data.VITE_SUPABASE_URL,
  supabaseAnonKey: resultado.data.VITE_SUPABASE_ANON_KEY,
} as const;
