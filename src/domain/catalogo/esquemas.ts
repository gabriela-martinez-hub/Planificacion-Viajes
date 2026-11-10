// Esquemas Zod del catálogo. Reflejan el esquema SQL de
// supabase/migrations/20261109210000_catalogo.sql (plan.md 5.1) para que el
// seed (T-08) se valide antes de cargarlo y para tipar el catálogo en la app.
//
// Reglas comunes:
// - Los id son textos estables en minúsculas con guiones (p. ej. 'salento').
// - Los montos son enteros en COP (plan.md 5.4).
// - Los valores cerrados se validan con z.enum, igual que los CHECK del SQL.

import { z } from 'zod';

// ------------------------------------------------------------ primitivas

/** Id estable: minúsculas, números y guiones, igual que `~ '^[a-z0-9-]+$'`. */
export const id = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'El id debe ser minúsculas, números y guiones');

const codigoDepartamento = z.string().regex(/^[0-9]{2}$/);
const codigoMunicipio = z.string().regex(/^[0-9]{5}$/);

const latitud = z.number().min(-90).max(90);
const longitud = z.number().min(-180).max(180);
const altitud = z.number().int().min(0).max(6000);

const copEntero = z.number().int().min(0);
const copPositivo = z.number().int().positive();

/** Hora 'HH:MM' o 'HH:MM:SS', como el tipo `time` de Postgres. */
const hora = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Hora inválida (HH:MM)');

/** Fecha 'AAAA-MM-DD', como el tipo `date` de Postgres. */
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe ser AAAA-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha inexistente');

const fuente = z.string().min(1, 'La fuente no puede estar vacía');

/** Día de la semana: 0 = domingo … 6 = sábado. */
const diaSemana = z.number().int().min(0).max(6);

export const ESTILOS = [
  'aventura',
  'naturaleza',
  'cultura_cafetera',
  'descanso',
  'gastronomia',
] as const;
export const estilo = z.enum(ESTILOS);

export const estadoAcceso = z.enum(['abierta', 'restringida', 'cerrada']);

// ------------------------------------------------------------ departamentos

export const departamentoSchema = z.object({
  id,
  nombre: z.string().min(1),
  codigo_dane: codigoDepartamento,
});
export type Departamento = z.infer<typeof departamentoSchema>;

// ------------------------------------------------------------ nodos

export const nodoSchema = z.object({
  id,
  tipo: z.enum(['municipio', 'externo']),
  nombre: z.string().min(1),
  lat: latitud,
  lon: longitud,
});
export type Nodo = z.infer<typeof nodoSchema>;

// ------------------------------------------------------------ municipios

export const municipioSchema = z.object({
  id,
  departamento_id: id,
  codigo_dane: codigoMunicipio,
  nombre: z.string().min(1),
  lat: latitud,
  lon: longitud,
  altitud_m: altitud,
  es_pueblo_patrimonio: z.boolean().default(false),
  radio_checkin_m: z.number().int().min(50).max(5000).default(1500),
});
export type Municipio = z.infer<typeof municipioSchema>;
export type MunicipioSeed = z.input<typeof municipioSchema>;

// ------------------------------------------------------------ orígenes externos

export const origenExternoSchema = z.object({
  id,
  nombre: z.string().min(1),
  lat: latitud,
  lon: longitud,
});
export type OrigenExterno = z.infer<typeof origenExternoSchema>;

// ------------------------------------------------------------ atracciones

export const atraccionSchema = z
  .object({
    id,
    municipio_id: id,
    nombre: z.string().min(1),
    categoria: z.string().min(1),
    lat: latitud,
    lon: longitud,
    altitud_m: altitud.optional(),
    es_casco_urbano: z.boolean().default(false),
    costo_entrada_cop: copEntero.default(0),
    tarifa_extranjero_cop: copEntero.optional(),
    costo_actividad_cop: copEntero.optional(),
    costo_aproximado: z.boolean().default(true),
    duracion_min: copPositivo,
    minutos_desde_casco: z.number().int().min(0).default(0),
    transporte_local_cop: copEntero.default(0),
    horario_apertura: hora.optional(),
    horario_cierre: hora.optional(),
    dias_cerrado: z.array(diaSemana).default([]),
    al_aire_libre: z.boolean(),
    estilos: z.array(estilo).default([]),
    requiere_guia: z.boolean().default(false),
    estado_acceso: estadoAcceso.default('abierta'),
    nota_acceso: z.string().optional(),
    radio_checkin_m: z.number().int().min(50).max(5000).default(300),
    descripcion: z.string().default(''),
    fecha_actualizacion: fecha,
    fuente,
  })
  // Horario: ambos nulos o apertura < cierre (igual que el CHECK del SQL).
  .refine(
    (a) =>
      (a.horario_apertura === undefined && a.horario_cierre === undefined) ||
      (a.horario_apertura !== undefined &&
        a.horario_cierre !== undefined &&
        a.horario_cierre > a.horario_apertura),
    { message: 'El horario debe tener apertura y cierre, y cierre > apertura' },
  )
  // El casco urbano no cobra entrada ni tiene traslado desde el casco.
  .refine(
    (a) =>
      !a.es_casco_urbano ||
      (a.costo_entrada_cop === 0 && a.minutos_desde_casco === 0),
    {
      message: 'El casco urbano no cobra entrada ni tiene minutos_desde_casco',
    },
  );
export type Atraccion = z.infer<typeof atraccionSchema>;
/** Forma de ENTRADA: los campos con default son opcionales (para el seed). */
export type AtraccionSeed = z.input<typeof atraccionSchema>;

// ------------------------------------------------------------ rutas de bus

export const rutaBusSchema = z
  .object({
    nodo_origen: id,
    nodo_destino: id,
    minutos: copPositivo,
    distancia_km: z.number().positive().optional(),
    tarifa_cop: copEntero,
    costo_aproximado: z.boolean().default(true),
    frecuencia_diaria: copPositivo.optional(),
    empresa: z.string().optional(),
    fecha_actualizacion: fecha,
    fuente,
  })
  .refine((r) => r.nodo_origen !== r.nodo_destino, {
    message: 'Una ruta de bus no puede ir de un nodo a sí mismo',
  });
export type RutaBus = z.infer<typeof rutaBusSchema>;
export type RutaBusSeed = z.input<typeof rutaBusSchema>;

// ------------------------------------------------------------ tarifas de referencia

export const tarifaReferenciaSchema = z
  .object({
    concepto: z.enum(['alojamiento', 'comida']),
    nivel: z.enum(['economico', 'medio', 'alto']),
    municipio_id: id.optional(), // nulo = tarifa regional
    valor_cop: copPositivo,
    unidad: z.enum(['persona_noche', 'persona_dia']),
    costo_aproximado: z.boolean().default(true),
    fecha_actualizacion: fecha,
    fuente,
  })
  .refine(
    (t) =>
      (t.concepto === 'alojamiento' && t.unidad === 'persona_noche') ||
      (t.concepto === 'comida' && t.unidad === 'persona_dia'),
    { message: 'alojamiento usa persona_noche y comida usa persona_dia' },
  );
export type TarifaReferencia = z.infer<typeof tarifaReferenciaSchema>;
export type TarifaReferenciaSeed = z.input<typeof tarifaReferenciaSchema>;

// ------------------------------------------------------------ clima mensual

export const climaMensualSchema = z
  .object({
    municipio_id: id,
    mes: z.number().int().min(1).max(12),
    precip_mm: z.number().min(0),
    dias_lluvia: z.number().min(0).max(31),
    prob_lluvia: z.number().min(0).max(1),
    temp_min: z.number(),
    temp_max: z.number(),
    temporada_relativa: z.enum(['menos_lluviosa', 'mas_lluviosa']),
  })
  .refine((c) => c.temp_max >= c.temp_min, {
    message: 'temp_max debe ser mayor o igual que temp_min',
  });
export type ClimaMensual = z.infer<typeof climaMensualSchema>;

// ------------------------------------------------------------ rutas temáticas

export const rutaTematicaSchema = z.object({
  id,
  clave_texto: z
    .string()
    .regex(/^rutas\.[A-Za-z0-9_]+$/, "clave_texto debe empezar con 'rutas.'"),
  fuente,
});
export type RutaTematica = z.infer<typeof rutaTematicaSchema>;

export const rutaItemSchema = z
  .object({
    ruta_id: id,
    municipio_id: id.optional(),
    atraccion_id: id.optional(),
  })
  .refine(
    (i) => (i.municipio_id === undefined) !== (i.atraccion_id === undefined),
    {
      message: 'Un ítem de ruta refiere un municipio o una atracción, no ambos',
    },
  );
export type RutaItem = z.infer<typeof rutaItemSchema>;

// ------------------------------------------------------------ insignias

export const insigniaSchema = z
  .object({
    id,
    tipo: z.enum(['municipio', 'atraccion', 'departamento', 'eje', 'ruta']),
    municipio_id: id.optional(),
    atraccion_id: id.optional(),
    departamento_id: id.optional(),
    ruta_id: id.optional(),
    clave_texto: z
      .string()
      .regex(
        /^insignias\.[A-Za-z0-9_.]+$/,
        "clave_texto debe empezar con 'insignias.'",
      ),
    icono: z.string().min(1),
  })
  .refine(
    (b) => {
      const refs = {
        municipio: b.municipio_id,
        atraccion: b.atraccion_id,
        departamento: b.departamento_id,
        ruta: b.ruta_id,
      };
      const definidas = Object.values(refs).filter(
        (v) => v !== undefined,
      ).length;
      if (b.tipo === 'eje') return definidas === 0;
      // El tipo exige su referencia y ninguna otra.
      return refs[b.tipo] !== undefined && definidas === 1;
    },
    { message: 'La insignia debe llevar solo la referencia de su tipo' },
  );
export type Insignia = z.infer<typeof insigniaSchema>;

// ------------------------------------------------------------ catálogo completo

export const catalogoSchema = z.object({
  departamentos: z.array(departamentoSchema),
  municipios: z.array(municipioSchema),
  origenes_externos: z.array(origenExternoSchema),
  atracciones: z.array(atraccionSchema),
  rutas_bus: z.array(rutaBusSchema),
  tarifas_referencia: z.array(tarifaReferenciaSchema),
  clima_mensual: z.array(climaMensualSchema),
  rutas_tematicas: z.array(rutaTematicaSchema),
  ruta_items: z.array(rutaItemSchema),
  insignias: z.array(insigniaSchema),
});
export type Catalogo = z.infer<typeof catalogoSchema>;
