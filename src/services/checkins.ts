// Servicio de check-ins e insignias del usuario (plan.md 6.4).
//
// El check-in se crea SOLO con la RPC registrar_checkin (SECURITY DEFINER), que
// calcula la distancia y decide `verificado` en el servidor y descarta las
// coordenadas. El cliente nunca escribe en checkins ni en insignias_usuario.
// Las respuestas se validan con Zod, como en src/services/catalogo.ts.

import { supabase } from './supabase';
import {
  checkinSchema,
  insigniaUsuarioSchema,
  type Checkin,
  type InsigniaUsuario,
} from '@/domain/insignias/esquemas';

/** Argumentos del check-in. idCliente hace la operación idempotente. */
export interface ArgsCheckin {
  /** Id de la atracción o del municipio (casco urbano). */
  lugarId: string;
  lat: number;
  lon: number;
  /** Precisión del GPS en metros reportada por el dispositivo. */
  precisionM: number;
  /** UUID generado en el cliente; reenviarlo no crea duplicados. */
  idCliente: string;
}

/**
 * Registra un check-in por GPS llamando a la RPC del servidor. Devuelve la fila
 * creada (o la existente si se reenvió el mismo idCliente). El trigger del
 * servidor actualiza las insignias por su cuenta; el llamador debe refrescar
 * esa query.
 */
export async function registrarCheckin(args: ArgsCheckin): Promise<Checkin> {
  const { data, error } = await supabase.rpc('registrar_checkin', {
    p_lugar_id: args.lugarId,
    p_lat: args.lat,
    p_lon: args.lon,
    p_precision_m: Math.round(args.precisionM),
    p_id_cliente: args.idCliente,
    p_manual: false,
  });
  if (error)
    throw new Error(`No se pudo registrar el check-in: ${error.message}`);
  return checkinSchema.parse(data);
}

/**
 * Registra un check-in MANUAL (no verificado). No envía coordenadas: el servidor
 * lo marca no verificado y deja distancia_m y precision_m en null (plan.md 6.4).
 */
export async function registrarCheckinManual(args: {
  lugarId: string;
  idCliente: string;
}): Promise<Checkin> {
  const { data, error } = await supabase.rpc('registrar_checkin', {
    p_lugar_id: args.lugarId,
    p_lat: 0,
    p_lon: 0,
    p_precision_m: 0,
    p_id_cliente: args.idCliente,
    p_manual: true,
  });
  if (error)
    throw new Error(`No se pudo registrar el check-in: ${error.message}`);
  return checkinSchema.parse(data);
}

/** Lista los check-ins del usuario (del más reciente al más antiguo). */
export async function listarCheckins(): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select(
      'id, id_cliente, usuario_id, atraccion_id, municipio_id, recibido_en, verificado, distancia_m, precision_m',
    )
    .order('recibido_en', { ascending: false });
  if (error)
    throw new Error(`No se pudieron leer los check-ins: ${error.message}`);
  return checkinSchema.array().parse(data ?? []);
}

/** Lista las insignias obtenidas por el usuario. */
export async function listarInsigniasUsuario(): Promise<InsigniaUsuario[]> {
  const { data, error } = await supabase
    .from('insignias_usuario')
    .select('usuario_id, insignia_id, obtenida_en, verificada');
  if (error)
    throw new Error(`No se pudieron leer las insignias: ${error.message}`);
  return insigniaUsuarioSchema.array().parse(data ?? []);
}
