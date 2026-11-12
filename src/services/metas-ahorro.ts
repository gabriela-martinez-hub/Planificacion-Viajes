// Meta de ahorro y aportes de un viaje en Supabase (T-16, modo soñado).
//
// Las tablas metas_ahorro y aportes_ahorro (T-12) tienen RLS por propietario:
// el usuario solo ve y escribe lo de sus viajes (EXISTS sobre viajes). El
// servicio no filtra por usuario al leer; la política lo hace.
//
// La cuota NO se guarda: se calcula en el dominio (domain/presupuesto/ahorro).

import { supabase } from './supabase';
import type { Aporte, FrecuenciaAhorro } from '@/domain/presupuesto';

export interface MetaAhorro {
  viaje_id: string;
  monto_objetivo_cop: number;
  frecuencia: FrecuenciaAhorro;
}

interface AporteFila {
  fecha: string;
  monto_cop: number;
}

/** Crea o actualiza la meta de un viaje (PK = viaje_id, una por viaje). */
export async function guardarMeta(meta: MetaAhorro): Promise<void> {
  const { error } = await supabase.from('metas_ahorro').upsert(
    {
      viaje_id: meta.viaje_id,
      monto_objetivo_cop: meta.monto_objetivo_cop,
      frecuencia: meta.frecuencia,
    },
    { onConflict: 'viaje_id' },
  );
  if (error) throw new Error(`No se pudo guardar la meta: ${error.message}`);
}

/** Lee la meta de un viaje, o null si no tiene. */
export async function obtenerMeta(viajeId: string): Promise<MetaAhorro | null> {
  const { data, error } = await supabase
    .from('metas_ahorro')
    .select('viaje_id, monto_objetivo_cop, frecuencia')
    .eq('viaje_id', viajeId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la meta: ${error.message}`);
  return (data as MetaAhorro | null) ?? null;
}

/** Lista los aportes de un viaje (del más antiguo al más reciente). */
export async function listarAportes(viajeId: string): Promise<Aporte[]> {
  const { data, error } = await supabase
    .from('aportes_ahorro')
    .select('fecha, monto_cop')
    .eq('viaje_id', viajeId)
    .order('fecha', { ascending: true });
  if (error)
    throw new Error(`No se pudieron leer los aportes: ${error.message}`);
  return ((data ?? []) as AporteFila[]).map((a) => ({
    fecha: a.fecha,
    montoCop: a.monto_cop,
  }));
}

/** Registra un aporte (monto > 0; la tabla lo exige con un CHECK). */
export async function registrarAporte(
  viajeId: string,
  fecha: string,
  montoCop: number,
): Promise<void> {
  if (montoCop <= 0) throw new Error('El aporte debe ser mayor que cero.');
  const { error } = await supabase
    .from('aportes_ahorro')
    .insert({ viaje_id: viajeId, fecha, monto_cop: montoCop });
  if (error)
    throw new Error(`No se pudo registrar el aporte: ${error.message}`);
}
