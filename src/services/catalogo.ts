// Lectura del catálogo desde Supabase con la clave anon (solo lectura por RLS).
// Las respuestas se validan con los esquemas Zod del dominio: si la base
// devuelve algo inesperado, la función lanza y TanStack Query lo trata como
// error (principio de validación del plan, sección 4).
//
// Los municipios viven repartidos entre la tabla `nodos` (nombre, lat, lon) y
// `municipios` (resto de campos); se combinan con un select anidado de PostgREST.
import { z } from 'zod';
import { supabase } from './supabase';
import {
  municipioSchema,
  atraccionSchema,
  departamentoSchema,
  origenExternoSchema,
  rutaBusSchema,
  tarifaReferenciaSchema,
  type Municipio,
  type Atraccion,
  type Departamento,
  type OrigenExterno,
  type RutaBus,
  type TarifaReferencia,
} from '@/domain/catalogo/esquemas';

/** Convierte null de la base en undefined para que Zod aplique opcionales. */
function sinNulos<T extends Record<string, unknown>>(fila: T): T {
  const salida: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(fila)) {
    salida[clave] = valor === null ? undefined : valor;
  }
  return salida as T;
}

export async function obtenerDepartamentos(): Promise<Departamento[]> {
  const { data, error } = await supabase
    .from('departamentos')
    .select('id, nombre, codigo_dane')
    .order('nombre');
  if (error)
    throw new Error(`No se pudieron leer los departamentos: ${error.message}`);
  return z.array(departamentoSchema).parse(data ?? []);
}

export async function obtenerMunicipios(): Promise<Municipio[]> {
  // nodos(id, nombre, lat, lon) !inner trae los datos geográficos del municipio.
  const { data, error } = await supabase
    .from('municipios')
    .select(
      'id, departamento_id, codigo_dane, altitud_m, es_pueblo_patrimonio, ' +
        'radio_checkin_m, nodos!inner(nombre, lat, lon)',
    );
  if (error)
    throw new Error(`No se pudieron leer los municipios: ${error.message}`);

  interface FilaMunicipio {
    id: string;
    departamento_id: string;
    codigo_dane: string;
    altitud_m: number | null;
    es_pueblo_patrimonio: boolean;
    radio_checkin_m: number;
    nodos: { nombre: string; lat: number; lon: number };
  }

  const filas = ((data ?? []) as unknown as FilaMunicipio[]).map((m) =>
    sinNulos({
      id: m.id,
      departamento_id: m.departamento_id,
      codigo_dane: m.codigo_dane,
      nombre: m.nodos.nombre,
      lat: m.nodos.lat,
      lon: m.nodos.lon,
      altitud_m: m.altitud_m,
      es_pueblo_patrimonio: m.es_pueblo_patrimonio,
      radio_checkin_m: m.radio_checkin_m,
    }),
  );
  return z
    .array(municipioSchema)
    .parse(filas)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function obtenerAtracciones(): Promise<Atraccion[]> {
  const { data, error } = await supabase.from('atracciones').select('*');
  if (error)
    throw new Error(`No se pudieron leer las atracciones: ${error.message}`);
  const filas = (data ?? []).map((a) => sinNulos(a as Record<string, unknown>));
  return z
    .array(atraccionSchema)
    .parse(filas)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// --- Datos que necesita el generador de itinerario (T-11/T-13) ---

/** Orígenes externos (Bogotá, Medellín, Cali). Nombre y coordenadas en `nodos`. */
export async function obtenerOrigenesExternos(): Promise<OrigenExterno[]> {
  const { data, error } = await supabase
    .from('origenes_externos')
    .select('id, nodos!inner(nombre, lat, lon)');
  if (error)
    throw new Error(
      `No se pudieron leer los orígenes externos: ${error.message}`,
    );

  interface Fila {
    id: string;
    nodos: { nombre: string; lat: number; lon: number };
  }
  const filas = ((data ?? []) as unknown as Fila[]).map((o) => ({
    id: o.id,
    nombre: o.nodos.nombre,
    lat: o.nodos.lat,
    lon: o.nodos.lon,
  }));
  return z
    .array(origenExternoSchema)
    .parse(filas)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Rutas de bus directas (ambos sentidos). El grafo se arma en el dominio. */
export async function obtenerRutasBus(): Promise<RutaBus[]> {
  const { data, error } = await supabase
    .from('rutas_bus')
    .select(
      'nodo_origen, nodo_destino, minutos, distancia_km, tarifa_cop, ' +
        'costo_aproximado, frecuencia_diaria, empresa, fecha_actualizacion, fuente',
    );
  if (error)
    throw new Error(`No se pudieron leer las rutas de bus: ${error.message}`);
  const filas = (data ?? []).map((r) =>
    sinNulos(r as unknown as Record<string, unknown>),
  );
  return z.array(rutaBusSchema).parse(filas);
}

/** Tarifas de referencia de alojamiento y comida por nivel. */
export async function obtenerTarifas(): Promise<TarifaReferencia[]> {
  const { data, error } = await supabase
    .from('tarifas_referencia')
    .select(
      'concepto, nivel, municipio_id, valor_cop, unidad, ' +
        'costo_aproximado, fecha_actualizacion, fuente',
    );
  if (error)
    throw new Error(`No se pudieron leer las tarifas: ${error.message}`);
  const filas = (data ?? []).map((tf) =>
    sinNulos(tf as unknown as Record<string, unknown>),
  );
  return z.array(tarifaReferenciaSchema).parse(filas);
}
