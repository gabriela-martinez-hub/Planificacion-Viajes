// Esquemas Zod de los datos de usuario relacionados con insignias y check-ins
// (plan.md 5.2). Reflejan las tablas de la migración
// supabase/migrations/20261112130000_checkins_insignias.sql para validar las
// respuestas de Supabase, igual que src/domain/catalogo/esquemas.ts hace con el
// catálogo.

import { z } from 'zod';
import { id } from '../catalogo/esquemas';

const uuid = z.string().uuid();
const copEntero = z.number().int().min(0);

// ------------------------------------------------------------ check-ins

/** Fila de public.checkins devuelta por la RPC registrar_checkin. */
export const checkinSchema = z.object({
  id: uuid,
  id_cliente: uuid,
  usuario_id: uuid,
  // Solo los check-ins sobre una atracción llevan atraccion_id.
  atraccion_id: id.nullable(),
  municipio_id: id,
  recibido_en: z.string(),
  verificado: z.boolean(),
  // La tabla permite null (p. ej. si alguna vez faltara el dato).
  distancia_m: copEntero.nullable(),
  precision_m: copEntero.nullable(),
});
export type Checkin = z.infer<typeof checkinSchema>;

// ------------------------------------------------------------ insignias de usuario

/** Fila de public.insignias_usuario (progreso del usuario). */
export const insigniaUsuarioSchema = z.object({
  usuario_id: uuid,
  insignia_id: id,
  obtenida_en: z.string(),
  verificada: z.boolean(),
});
export type InsigniaUsuario = z.infer<typeof insigniaUsuarioSchema>;
