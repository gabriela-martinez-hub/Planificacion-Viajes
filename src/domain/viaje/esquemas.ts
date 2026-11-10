// Esquemas Zod de los datos de usuario (plan.md 5.2). Reflejan el SQL de
// supabase/migrations/20261110120000_datos_usuario.sql (T-12). Se usan para
// validar el formulario del planificador y, más adelante (T-14), lo que se lee
// y escribe en Supabase.
//
// En T-13 el viaje vive en memoria (no se persiste); estos esquemas tipan el
// formulario y la entrada del generador.

import { z } from 'zod';
import { id, estilo } from '../catalogo/esquemas';

export const NIVELES = ['economico', 'medio', 'alto'] as const;
export const nivel = z.enum(NIVELES);

export const modoPresupuesto = z.enum(['fijo', 'sonado']);
export const estadoViaje = z.enum([
  'borrador',
  'planeado',
  'en_curso',
  'terminado',
]);

/** Fecha 'AAAA-MM-DD', como el tipo date de Postgres. */
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe ser AAAA-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha inexistente');

// ------------------------------------------------------------ formulario del viaje

/**
 * Datos que el usuario llena para pedir un itinerario. Es la forma validada del
 * formulario del planificador; de aquí se arma la EntradaItinerario del dominio.
 */
export const formularioViajeSchema = z
  .object({
    titulo: z.string().min(1, 'Ponle un título al viaje'),
    origenNodoId: id,
    fechaInicio: fecha,
    fechaFin: fecha,
    incluyeRegreso: z.boolean().default(true),
    viajeros: z.number().int().min(1, 'Debe viajar al menos una persona'),
    estilos: z.array(estilo).default([]),
    nivel,
    municipiosElegidos: z
      .array(id)
      .min(1, 'Elige al menos un municipio para visitar'),
    atraccionesObligatorias: z.array(id).default([]),
    limiteJornadaMin: z.number().int().positive().default(540),
    modoPresupuesto: modoPresupuesto.default('fijo'),
    presupuestoCop: z.number().int().min(0).optional(),
    // Fecha actual 'AAAA-MM-DD' que pasa la UI (el dominio no lee el reloj).
    // Si está, se valida que el viaje no empiece en el pasado.
    hoy: fecha.optional(),
  })
  .refine((v) => v.fechaFin >= v.fechaInicio, {
    message: 'La fecha de regreso no puede ser anterior a la de ida',
    path: ['fechaFin'],
  })
  .refine((v) => v.hoy === undefined || v.fechaInicio >= v.hoy, {
    message: 'No puedes planificar un viaje con fecha de ida en el pasado',
    path: ['fechaInicio'],
  });
export type FormularioViaje = z.infer<typeof formularioViajeSchema>;

// ------------------------------------------------------------ tablas (para T-14)

export const viajeSchema = z.object({
  id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  titulo: z.string().min(1),
  fecha_inicio: fecha,
  fecha_fin: fecha,
  origen_nodo_id: id,
  incluye_regreso: z.boolean(),
  viajeros: z.number().int().min(1),
  estilos: z.array(estilo),
  nivel,
  municipios_ids: z.array(id),
  atracciones_obligatorias_ids: z.array(id),
  limite_jornada_min: z.number().int().positive(),
  umbral_lluvia: z.record(z.unknown()).default({}),
  version_catalogo: z.string().optional(),
  modo_presupuesto: modoPresupuesto,
  presupuesto_cop: z.number().int().min(0).optional(),
  estado: estadoViaje,
});
export type Viaje = z.infer<typeof viajeSchema>;

export const viajeDiaSchema = z.object({
  viaje_id: z.string().uuid(),
  dia: z.number().int().min(1),
  municipio_base_id: id,
  nivel_alojamiento: nivel,
  nivel_comida: nivel,
});
export type ViajeDia = z.infer<typeof viajeDiaSchema>;

export const viajeItemSchema = z.object({
  id: z.string().uuid(),
  viaje_id: z.string().uuid(),
  dia: z.number().int().min(1),
  orden: z.number().int().min(1),
  atraccion_id: id.optional(),
  tipo: z.enum(['actividad', 'traslado', 'alojamiento', 'comida', 'libre']),
  hora_inicio: z.string().optional(),
  duracion_min: z.number().int().min(0),
  costo_estimado_cop: z.number().int().min(0),
  fijado: z.boolean(),
  notas: z.string().optional(),
});
export type ViajeItem = z.infer<typeof viajeItemSchema>;
