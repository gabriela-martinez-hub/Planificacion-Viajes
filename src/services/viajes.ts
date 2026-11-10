// Escritura y lectura de viajes del usuario en Supabase (T-14, pieza A).
// Las RLS (T-12) garantizan que cada usuario solo ve y escribe lo suyo; el
// servicio no necesita filtrar por usuario al leer (la política lo hace).
//
// Supabase-js no ofrece transacción multi-tabla desde el cliente, así que el
// guardado es: insertar el viaje, obtener su id, insertar días e ítems en lote.
// Si falla un paso posterior, se borra el viaje (ON DELETE CASCADE limpia los
// hijos) para no dejar un viaje a medias.

import { supabase } from './supabase';
import type {
  ViajePersistible,
  ViajeDiaFila,
  ViajeItemFila,
} from '@/features/planificador/persistir';

export interface ViajeResumen {
  id: string;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  origen_nodo_id: string;
  estado: string;
}

/** Inserta un viaje completo. Devuelve el id del viaje creado. */
export async function guardarViaje(payload: ViajePersistible): Promise<string> {
  // El usuario_id debe ser el de la sesión: la RLS exige usuario_id = auth.uid()
  // y la columna es NOT NULL sin default, así que hay que enviarlo explícito.
  const { data: auth, error: errorAuth } = await supabase.auth.getUser();
  if (errorAuth || !auth.user) {
    throw new Error('Debes iniciar sesión para guardar el viaje.');
  }

  const { data, error } = await supabase
    .from('viajes')
    .insert({ ...payload.viaje, usuario_id: auth.user.id })
    .select('id')
    .single();
  if (error || !data)
    throw new Error(`No se pudo guardar el viaje: ${error?.message ?? ''}`);
  const viajeId = (data as { id: string }).id;

  try {
    const dias = payload.dias.map((d) => ({ ...d, viaje_id: viajeId }));
    const { error: errorDias } = await supabase.from('viaje_dias').insert(dias);
    if (errorDias) throw new Error(errorDias.message);

    const items = payload.items.map((it) => ({ ...it, viaje_id: viajeId }));
    const { error: errorItems } = await supabase
      .from('viaje_items')
      .insert(items);
    if (errorItems) throw new Error(errorItems.message);
  } catch (e) {
    // Revertir: borrar el viaje a medias (cascade borra días e ítems).
    await supabase.from('viajes').delete().eq('id', viajeId);
    throw new Error(
      `No se pudieron guardar los detalles del viaje: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }

  return viajeId;
}

/** Lista los viajes del usuario (los más recientes primero). */
export async function listarViajes(): Promise<ViajeResumen[]> {
  const { data, error } = await supabase
    .from('viajes')
    .select('id, titulo, fecha_inicio, fecha_fin, origen_nodo_id, estado')
    .order('creado_en', { ascending: false });
  if (error)
    throw new Error(`No se pudieron listar los viajes: ${error.message}`);
  return (data ?? []) as ViajeResumen[];
}

/** Días e ítems de un viaje, para reconstruir la vista. */
export async function obtenerDetalleViaje(viajeId: string): Promise<{
  dias: ViajeDiaFila[];
  items: ViajeItemFila[];
}> {
  const [resDias, resItems] = await Promise.all([
    supabase
      .from('viaje_dias')
      .select('dia, municipio_base_id')
      .eq('viaje_id', viajeId)
      .order('dia'),
    supabase
      .from('viaje_items')
      .select(
        'dia, orden, atraccion_id, tipo, duracion_min, costo_estimado_cop, fijado',
      )
      .eq('viaje_id', viajeId)
      .order('dia')
      .order('orden'),
  ]);
  if (resDias.error)
    throw new Error(`No se pudieron leer los días: ${resDias.error.message}`);
  if (resItems.error)
    throw new Error(`No se pudieron leer los ítems: ${resItems.error.message}`);
  return {
    dias: (resDias.data ?? []) as ViajeDiaFila[],
    items: (resItems.data ?? []) as ViajeItemFila[],
  };
}

/** Borra un viaje del usuario (cascade borra días e ítems). */
export async function eliminarViaje(viajeId: string): Promise<void> {
  const { error } = await supabase.from('viajes').delete().eq('id', viajeId);
  if (error) throw new Error(`No se pudo eliminar el viaje: ${error.message}`);
}
