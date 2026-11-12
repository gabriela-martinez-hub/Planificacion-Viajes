// Servicio del perfil del usuario (plan.md 5.2, 6.4). Por ahora cubre el
// consentimiento de tratamiento de datos, que se pide antes del primer check-in
// (T-20). La tabla perfiles tiene PK = auth.users.id y RLS por propietario.

import { supabase } from './supabase';

interface PerfilFila {
  consentimiento_datos_en: string | null;
}

/**
 * Devuelve la fecha ISO del consentimiento de datos, o null si el usuario aún
 * no lo ha dado (o no tiene fila de perfil).
 */
export async function obtenerConsentimiento(): Promise<string | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('consentimiento_datos_en')
    .maybeSingle();
  if (error)
    throw new Error(`No se pudo leer el consentimiento: ${error.message}`);
  return (data as PerfilFila | null)?.consentimiento_datos_en ?? null;
}

/**
 * Registra el consentimiento de datos del usuario actual con la fecha del
 * cliente. Usa upsert porque puede que aún no exista la fila de perfil (no se
 * crea automáticamente al iniciar sesión).
 */
export async function guardarConsentimiento(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const usuarioId = auth.user?.id;
  if (!usuarioId)
    throw new Error('Se requiere sesión para dar el consentimiento.');

  const ahora = new Date().toISOString();
  const { error } = await supabase.from('perfiles').upsert(
    {
      id: usuarioId,
      nombre:
        (auth.user?.user_metadata?.full_name as string | undefined) ?? null,
      avatar_url:
        (auth.user?.user_metadata?.avatar_url as string | undefined) ?? null,
      consentimiento_datos_en: ahora,
    },
    { onConflict: 'id' },
  );
  if (error)
    throw new Error(`No se pudo guardar el consentimiento: ${error.message}`);
  return ahora;
}
