// Serialización del viaje para guardarlo en Supabase (T-14, pieza A) y
// reconstrucción para mostrarlo. Funciones puras: no tocan la red ni Supabase,
// para poder probarlas sin sesión. El servicio (services/viajes.ts) las usa.
//
// Mapeo con las tablas de T-12 (plan.md 5.2):
//   formulario + itinerario  ->  filas de viajes / viaje_dias / viaje_items
//   filas                    ->  Itinerario (para la vista día por día)
//
// Los costos de los ítems se guardan tal cual (plan.md 6.1 paso 6: no cambian al
// editar). `fijado` se conserva para que abrir un viaje muestre lo que el
// usuario dejó.

import type {
  DesgloseCostos,
  DiaItinerario,
  Itinerario,
  ItemItinerario,
  TipoItem,
} from '@/domain/itinerario';
import type { FormularioViaje, Nivel } from '@/domain/viaje/esquemas';

/** Fila para insertar en `viajes` (sin id ni usuario_id: los pone el servicio). */
export interface ViajeInsert {
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  origen_nodo_id: string;
  incluye_regreso: boolean;
  viajeros: number;
  estilos: string[];
  nivel: Nivel;
  municipios_ids: string[];
  atracciones_obligatorias_ids: string[];
  limite_jornada_min: number;
  modo_presupuesto: 'fijo' | 'sonado';
  presupuesto_cop?: number;
  estado: 'borrador' | 'planeado' | 'en_curso' | 'terminado';
}

export interface ViajeDiaInsert {
  dia: number;
  municipio_base_id: string;
  nivel_alojamiento: Nivel;
  nivel_comida: Nivel;
}

export interface ViajeItemInsert {
  dia: number;
  orden: number;
  atraccion_id?: string;
  tipo: TipoItem;
  duracion_min: number;
  costo_estimado_cop: number;
  fijado: boolean;
}

/** Conjunto de payloads que el servicio inserta en una transacción lógica. */
export interface ViajePersistible {
  viaje: ViajeInsert;
  dias: ViajeDiaInsert[];
  items: ViajeItemInsert[];
}

/** Arma los payloads a partir del formulario y el itinerario generado. */
export function serializarViaje(
  formulario: FormularioViaje,
  itinerario: Itinerario,
): ViajePersistible {
  const viaje: ViajeInsert = {
    titulo: formulario.titulo,
    fecha_inicio: formulario.fechaInicio,
    fecha_fin: formulario.fechaFin,
    origen_nodo_id: formulario.origenNodoId,
    incluye_regreso: formulario.incluyeRegreso,
    viajeros: formulario.viajeros,
    estilos: formulario.estilos,
    nivel: formulario.nivel,
    municipios_ids: formulario.municipiosElegidos,
    atracciones_obligatorias_ids: formulario.atraccionesObligatorias,
    limite_jornada_min: formulario.limiteJornadaMin,
    modo_presupuesto: formulario.modoPresupuesto,
    presupuesto_cop: formulario.presupuestoCop,
    estado: 'planeado',
  };

  const dias: ViajeDiaInsert[] = itinerario.dias.map((d) => ({
    dia: d.dia,
    municipio_base_id: d.municipioBaseId,
    // El generador usa un único nivel para el viaje; se guarda en ambos.
    nivel_alojamiento: formulario.nivel,
    nivel_comida: formulario.nivel,
  }));

  const items: ViajeItemInsert[] = itinerario.dias.flatMap((d) =>
    d.items.map((it) => ({
      dia: d.dia,
      orden: it.orden,
      atraccion_id: it.tipo === 'actividad' ? it.atraccionId : undefined,
      tipo: it.tipo,
      duracion_min: it.duracionMin,
      costo_estimado_cop: it.costoCop,
      fijado: it.fijado,
    })),
  );

  return { viaje, dias, items };
}

// ------------------------------------------------------------ reconstrucción

/** Filas tal como llegan de la base (lo mínimo que la vista necesita). */
export interface ViajeDiaFila {
  dia: number;
  municipio_base_id: string;
}
export interface ViajeItemFila {
  dia: number;
  orden: number;
  atraccion_id?: string | null;
  tipo: TipoItem;
  duracion_min: number;
  costo_estimado_cop: number;
  fijado: boolean;
}

/**
 * Reconstruye un Itinerario para la vista día por día a partir de las filas
 * guardadas. Las descripciones de los ítems se recalculan desde un diccionario
 * (nombre de atracción); para traslados/comida/alojamiento se usa la descripción
 * por tipo que provee quien llama. El clima y los avisos no se guardan.
 */
export function reconstruirItinerario(
  dias: ViajeDiaFila[],
  items: ViajeItemFila[],
  descripcionItem: (item: ViajeItemFila) => string,
): Itinerario {
  const porDia = new Map<number, ItemItinerario[]>();
  for (const it of items) {
    const lista = porDia.get(it.dia) ?? [];
    lista.push({
      orden: it.orden,
      tipo: it.tipo,
      atraccionId: it.atraccion_id ?? undefined,
      descripcion: descripcionItem(it),
      duracionMin: it.duracion_min,
      costoCop: it.costo_estimado_cop,
      fijado: it.fijado,
    });
    porDia.set(it.dia, lista);
  }

  const diasOrdenados = [...dias].sort((a, b) => a.dia - b.dia);
  const diasItinerario: DiaItinerario[] = diasOrdenados.map((d) => {
    const listaItems = (porDia.get(d.dia) ?? []).sort(
      (a, b) => a.orden - b.orden,
    );
    const minutosUsados = listaItems.reduce(
      (s, it) =>
        s +
        (it.tipo === 'actividad' || it.tipo === 'traslado'
          ? it.duracionMin
          : 0),
      0,
    );
    const soloTraslado =
      listaItems.length > 0 &&
      listaItems.every((it) => it.tipo !== 'actividad');
    return {
      dia: d.dia,
      fecha: '',
      municipioBaseId: d.municipio_base_id,
      items: listaItems,
      minutosUsados,
      soloTraslado,
      lluvioso: false,
    };
  });

  return {
    dias: diasItinerario,
    costos: sumarCostos(items),
    municipiosInalcanzables: [],
    avisos: [],
  };
}

/** Suma los costos guardados por tipo, para el resumen del viaje reconstruido. */
function sumarCostos(items: ViajeItemFila[]): DesgloseCostos {
  const costos: DesgloseCostos = {
    transporte: 0,
    alojamiento: 0,
    comida: 0,
    entradas: 0,
    actividades: 0,
    total: 0,
  };
  for (const it of items) {
    const v = it.costo_estimado_cop;
    costos.total += v;
    if (it.tipo === 'traslado') costos.transporte += v;
    else if (it.tipo === 'alojamiento') costos.alojamiento += v;
    else if (it.tipo === 'comida') costos.comida += v;
    else if (it.tipo === 'actividad') costos.entradas += v;
  }
  return costos;
}
