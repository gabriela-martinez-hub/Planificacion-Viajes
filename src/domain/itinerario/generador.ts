// Construcción voraz del itinerario (plan.md 6.1 pasos 1-6).
//
// Determinista: sin aleatoriedad y con el desempate de puntuacion.ts. La misma
// entrada (catálogo, clima y municipios) produce el mismo itinerario.
//
// Modelo simplificado y honesto con el alcance de T-11:
// - Cada municipio elegido alcanzable se asigna como base de un día (en orden
//   del camino más corto desde el origen). Si hay más días que municipios, los
//   días sobrantes se reparten entre las bases ya elegidas; si hay más
//   municipios que días, no todos entran (se informa con un aviso).
// - Las actividades de un día son atracciones del municipio base de ese día.
// - El tiempo de una actividad incluye ida y vuelta desde el casco
//   (2 × minutos_desde_casco) más su duración.
// - El presupuesto (paso 8) y el reordenamiento por clima (paso 9) NO se hacen
//   aquí: son T-15 y T-18. La búsqueda local (paso 7) está en busqueda-local.ts.

import type {
  Atraccion,
  Municipio,
  TarifaReferencia,
} from '../catalogo/esquemas';
import { GrafoBuses, type Camino } from './grafo-buses';
import {
  diaSemana,
  diasEntre,
  fechasDelViaje,
  finAntesDeInicio,
} from './fechas';
import { costoAtraccion, ordenarPorPreferencia } from './puntuacion';
import type {
  CatalogoItinerario,
  ClimaDia,
  DesgloseCostos,
  DiaItinerario,
  EntradaItinerario,
  ItemItinerario,
  Itinerario,
  MotivoFallo,
  Nivel,
  ResultadoItinerario,
} from './tipos';

const LIMITE_JORNADA_POR_DEFECTO = 540; // 9 h

/** Estado intermedio de un día durante la construcción. */
interface DiaEnConstruccion {
  dia: number;
  fecha: string;
  municipioBaseId: string;
  actividades: Atraccion[];
  caminoLlegada: Camino | null; // bus hasta la base al empezar el día
  esRegreso: boolean;
  caminoRegreso: Camino | null;
}

export function generarItinerario(
  entrada: EntradaItinerario,
): ResultadoItinerario {
  const {
    catalogo,
    origenNodoId,
    fechaInicio,
    fechaFin,
    incluyeRegreso,
    estilos,
    nivel,
    municipiosElegidos,
    atraccionesObligatorias,
    ordenMunicipios,
    climaPorDia,
  } = entrada;
  const limiteJornada = entrada.limiteJornadaMin || LIMITE_JORNADA_POR_DEFECTO;

  // --- Validaciones de entrada ---
  if (finAntesDeInicio(fechaInicio, fechaFin)) {
    return fallo(
      'rango_fechas_invalido',
      'La fecha de fin es anterior a la de inicio.',
    );
  }
  if (municipiosElegidos.length === 0) {
    return fallo(
      'sin_municipios',
      'No se eligió ningún municipio para el viaje.',
    );
  }

  const grafo = new GrafoBuses(catalogo.rutasBus);
  const esOrigenExterno = catalogo.origenesExternos.some(
    (o) => o.id === origenNodoId,
  );
  const esOrigenMunicipio = catalogo.municipios.some(
    (m) => m.id === origenNodoId,
  );
  if (!esOrigenExterno && !esOrigenMunicipio) {
    return fallo(
      'origen_desconocido',
      'El origen del viaje no existe en el catálogo.',
    );
  }

  const totalDias = diasEntre(fechaInicio, fechaFin);
  const fechas = fechasDelViaje(fechaInicio, totalDias);

  // Caso infactible: 1 día, origen externo y regreso (plan.md 6.1 paso 5).
  if (totalDias === 1 && esOrigenExterno && incluyeRegreso) {
    return fallo(
      'viaje_infactible',
      'Un viaje de un solo día desde una ciudad externa con regreso no es factible: no habría tiempo para visitar nada.',
    );
  }

  // --- Paso 1: filtrar y puntuar atracciones por municipio elegido, estado y día ---
  const municipioPorId = new Map(catalogo.municipios.map((m) => [m.id, m]));
  const obligatorias = new Set(atraccionesObligatorias);
  const avisos: string[] = [];

  // --- Paso 3: elegir qué municipios entran, ordenados por cercanía al origen ---
  const alcanzables: { municipio: Municipio; camino: Camino }[] = [];
  const inalcanzables: string[] = [];
  for (const id of municipiosElegidos) {
    const muni = municipioPorId.get(id);
    if (!muni) {
      inalcanzables.push(id);
      continue;
    }
    const camino = grafo.caminoMasCorto(origenNodoId, id);
    if (camino === null) {
      inalcanzables.push(id);
    } else {
      alcanzables.push({ municipio: muni, camino });
    }
  }
  if (inalcanzables.length > 0) {
    avisos.push(
      `No hay ruta de bus hasta: ${inalcanzables.join(', ')}. No se incluyeron en el itinerario.`,
    );
  }
  if (alcanzables.length === 0) {
    return fallo(
      'viaje_infactible',
      'Ninguno de los municipios elegidos es alcanzable en bus desde el origen.',
    );
  }
  // Orden de los municipios base. Por defecto, determinista por cercanía
  // (menor tiempo de camino, luego id). Si la UI pasó `ordenMunicipios`, se
  // respeta ese orden (el usuario puede preferir una ruta no óptima).
  if (ordenMunicipios && ordenMunicipios.length > 0) {
    const posicion = new Map(ordenMunicipios.map((id, i) => [id, i]));
    alcanzables.sort((a, b) => {
      const pa = posicion.get(a.municipio.id) ?? Number.MAX_SAFE_INTEGER;
      const pb = posicion.get(b.municipio.id) ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return a.municipio.id.localeCompare(b.municipio.id);
    });
  } else {
    alcanzables.sort((a, b) => {
      if (a.camino.minutos !== b.camino.minutos)
        return a.camino.minutos - b.camino.minutos;
      return a.municipio.id.localeCompare(b.municipio.id);
    });
  }

  // --- Asignar municipio base a cada día del viaje ---
  // Reservamos el último día para el regreso solo si hace falta; por ahora cada
  // día recibe una base rotando por los municipios alcanzables en orden.
  const dias: DiaEnConstruccion[] = [];
  for (let i = 0; i < totalDias; i++) {
    const base = alcanzables[Math.min(i, alcanzables.length - 1)].municipio;
    dias.push({
      dia: i + 1,
      fecha: fechas[i],
      municipioBaseId: base.id,
      actividades: [],
      caminoLlegada: null,
      esRegreso: false,
      caminoRegreso: null,
    });
  }
  if (alcanzables.length > totalDias) {
    const fuera = alcanzables.slice(totalDias).map((a) => a.municipio.id);
    avisos.push(
      `El viaje es más corto que los municipios elegidos; no se incluyeron: ${fuera.join(', ')}.`,
    );
  }

  // --- Paso 2 y 5: traslado de llegada el día 1 y de regreso el último día ---
  const base1 = dias[0].municipioBaseId;
  const caminoLlegada = grafo.caminoMasCorto(origenNodoId, base1);
  dias[0].caminoLlegada = caminoLlegada;
  const diaLlegadaSoloTraslado =
    caminoLlegada !== null && caminoLlegada.minutos > limiteJornada;
  if (diaLlegadaSoloTraslado) {
    avisos.push(
      `El día 1 es solo traslado desde el origen (${caminoLlegada!.minutosBus} min de bus): supera el límite de jornada.`,
    );
  }

  let diaRegresoSoloTraslado = false;
  if (incluyeRegreso) {
    const ultimo = dias[dias.length - 1];
    const caminoRegreso = grafo.caminoMasCorto(
      ultimo.municipioBaseId,
      origenNodoId,
    );
    ultimo.caminoRegreso = caminoRegreso;
    ultimo.esRegreso = true;
    diaRegresoSoloTraslado =
      caminoRegreso !== null && caminoRegreso.minutos > limiteJornada;
    if (diaRegresoSoloTraslado) {
      avisos.push(
        `El último día es solo traslado de regreso (${caminoRegreso!.minutosBus} min de bus): supera el límite de jornada.`,
      );
    }
  }

  // --- Paso 4: repartir atracciones por día respetando jornada y horarios ---
  // Agrupamos las atracciones candidatas por municipio.
  const candidatasPorMuni = new Map<string, Atraccion[]>();
  for (const a of catalogo.atracciones) {
    if (a.estado_acceso === 'cerrada' && !obligatorias.has(a.id)) continue;
    const lista = candidatasPorMuni.get(a.municipio_id) ?? [];
    lista.push(a);
    candidatasPorMuni.set(a.municipio_id, lista);
  }

  // Días que pueden recibir actividades (no son de solo traslado), agrupados por
  // municipio base. Repartir entre los días de una misma base evita amontonar
  // todo en el primer día y dejar los siguientes vacíos.
  const minutosDia = new Map<DiaEnConstruccion, number>();
  const diasPorBase = new Map<string, DiaEnConstruccion[]>();
  for (const d of dias) {
    let minutosTraslado = 0;
    if (d.caminoLlegada) minutosTraslado += d.caminoLlegada.minutos;
    if (d.caminoRegreso) minutosTraslado += d.caminoRegreso.minutos;
    minutosDia.set(d, minutosTraslado);

    const soloTraslado =
      (d.dia === 1 && diaLlegadaSoloTraslado) ||
      (d.esRegreso && diaRegresoSoloTraslado);
    if (soloTraslado) continue;

    const lista = diasPorBase.get(d.municipioBaseId) ?? [];
    lista.push(d);
    diasPorBase.set(d.municipioBaseId, lista);
  }

  const usadas = new Set<string>();
  for (const [base, diasBase] of diasPorBase) {
    const candidatas = ordenarPorPreferencia(
      candidatasPorMuni.get(base) ?? [],
      estilos,
    );
    for (const a of candidatas) {
      if (usadas.has(a.id)) continue;
      const costoTiempo = a.duracion_min + 2 * a.minutos_desde_casco;
      // Elegir, entre los días de esta base donde la atracción abre y cabe, el
      // que tenga más tiempo libre (desempate por número de día) para repartir.
      let elegido: DiaEnConstruccion | undefined;
      let maxLibre = -1;
      for (const d of diasBase) {
        if (a.dias_cerrado.includes(diaSemana(d.fecha))) continue;
        const usado = minutosDia.get(d) ?? 0;
        const libre = limiteJornada - usado;
        if (costoTiempo > libre) continue;
        if (
          libre > maxLibre ||
          (libre === maxLibre && (elegido === undefined || d.dia < elegido.dia))
        ) {
          maxLibre = libre;
          elegido = d;
        }
      }
      if (elegido) {
        elegido.actividades.push(a);
        usadas.add(a.id);
        minutosDia.set(elegido, (minutosDia.get(elegido) ?? 0) + costoTiempo);
      }
    }
  }

  // --- Forzar las atracciones obligatorias no ubicadas ---
  const sinUbicar = [...obligatorias].filter((id) => !usadas.has(id));
  for (const id of sinUbicar) {
    const atr = catalogo.atracciones.find((a) => a.id === id);
    if (!atr) continue;
    const d = dias.find((x) => x.municipioBaseId === atr.municipio_id);
    if (d) {
      d.actividades.push(atr);
      usadas.add(id);
    } else {
      avisos.push(
        `La atracción obligatoria ${id} está en un municipio que no es base de ningún día; no se pudo ubicar.`,
      );
    }
  }

  // --- Paso 6: construir ítems, costos de alojamiento y comida ---
  const itinerario = armarItinerario({
    dias,
    climaPorDia,
    catalogo,
    nivel,
    viajeros: entrada.viajeros,
    incluyeRegreso,
    limiteJornada,
    diaLlegadaSoloTraslado,
    diaRegresoSoloTraslado,
    inalcanzables,
    avisos,
  });

  return { ok: true, itinerario };
}

// ------------------------------------------------------------ armado de ítems

interface ArgsArmado {
  dias: DiaEnConstruccion[];
  climaPorDia: ClimaDia[];
  catalogo: CatalogoItinerario;
  nivel: Nivel;
  viajeros: number;
  incluyeRegreso: boolean;
  limiteJornada: number;
  diaLlegadaSoloTraslado: boolean;
  diaRegresoSoloTraslado: boolean;
  inalcanzables: string[];
  avisos: string[];
}

function armarItinerario(args: ArgsArmado): Itinerario {
  const {
    dias,
    climaPorDia,
    catalogo,
    nivel,
    viajeros,
    incluyeRegreso,
    diaLlegadaSoloTraslado,
    diaRegresoSoloTraslado,
    inalcanzables,
    avisos,
  } = args;

  const lluviaPorFecha = new Map(climaPorDia.map((c) => [c.fecha, c.lluvioso]));
  const nombreNodo = new Map<string, string>([
    ...catalogo.municipios.map((m) => [m.id, m.nombre] as [string, string]),
    ...catalogo.origenesExternos.map(
      (o) => [o.id, o.nombre] as [string, string],
    ),
  ]);
  const totalDias = dias.length;
  const noches = incluyeRegreso ? totalDias - 1 : totalDias;

  const tarifaAlojamiento = buscarTarifa(
    catalogo.tarifas,
    'alojamiento',
    nivel,
  );
  const tarifaComida = buscarTarifa(catalogo.tarifas, 'comida', nivel);

  const diasSalida: DiaItinerario[] = [];
  let costoTransporte = 0;
  let costoAlojamiento = 0;
  let costoComida = 0;
  let costoEntradas = 0;
  let costoActividades = 0;

  for (let idx = 0; idx < dias.length; idx++) {
    const d = dias[idx];
    const items: ItemItinerario[] = [];
    let orden = 1;
    let minutosUsados = 0;

    // Traslado de llegada (día 1).
    if (d.caminoLlegada && d.caminoLlegada.minutos > 0) {
      const costo = d.caminoLlegada.tarifaCop * viajeros;
      costoTransporte += costo;
      items.push({
        orden: orden++,
        tipo: 'traslado',
        descripcion: `Bus ${nombresDeCamino(d.caminoLlegada.nodos, nombreNodo)}`,
        duracionMin: d.caminoLlegada.minutosBus,
        costoCop: costo,
        fijado: false,
      });
      minutosUsados += d.caminoLlegada.minutos;
    }

    // Actividades del día.
    for (const a of d.actividades) {
      const costoPersona = costoAtraccion(a);
      const costo = costoPersona * viajeros;
      costoEntradas += a.costo_entrada_cop * viajeros;
      costoActividades += (a.costo_actividad_cop ?? 0) * viajeros;
      costoTransporte += a.transporte_local_cop * viajeros;
      const duracion = a.duracion_min + 2 * a.minutos_desde_casco;
      items.push({
        orden: orden++,
        tipo: 'actividad',
        atraccionId: a.id,
        descripcion: a.nombre,
        duracionMin: duracion,
        costoCop: costo,
        fijado: false,
      });
      minutosUsados += duracion;
    }

    // Traslado de regreso (último día).
    if (d.caminoRegreso && d.caminoRegreso.minutos > 0) {
      const costo = d.caminoRegreso.tarifaCop * viajeros;
      costoTransporte += costo;
      items.push({
        orden: orden++,
        tipo: 'traslado',
        descripcion: `Bus de regreso ${nombresDeCamino(d.caminoRegreso.nodos, nombreNodo)}`,
        duracionMin: d.caminoRegreso.minutosBus,
        costoCop: costo,
        fijado: false,
      });
      minutosUsados += d.caminoRegreso.minutos;
    }

    // Comida: todos los días.
    if (tarifaComida) {
      const costo = tarifaComida.valor_cop * viajeros;
      costoComida += costo;
      items.push({
        orden: orden++,
        tipo: 'comida',
        descripcion: `Comidas del día (nivel ${nivel})`,
        duracionMin: 0,
        costoCop: costo,
        fijado: false,
      });
    }

    // Alojamiento: una noche por día salvo el último si hay regreso.
    const hayNoche = idx < noches;
    if (hayNoche && tarifaAlojamiento) {
      const costo = tarifaAlojamiento.valor_cop * viajeros;
      costoAlojamiento += costo;
      items.push({
        orden: orden++,
        tipo: 'alojamiento',
        descripcion: `Alojamiento en ${nombreNodo.get(d.municipioBaseId) ?? d.municipioBaseId} (nivel ${nivel})`,
        duracionMin: 0,
        costoCop: costo,
        fijado: false,
      });
    }

    const soloTraslado =
      (d.dia === 1 && diaLlegadaSoloTraslado) ||
      (d.esRegreso && diaRegresoSoloTraslado);

    diasSalida.push({
      dia: d.dia,
      fecha: d.fecha,
      municipioBaseId: d.municipioBaseId,
      items,
      minutosUsados,
      soloTraslado,
      lluvioso: lluviaPorFecha.get(d.fecha) ?? false,
    });
  }

  const costos: DesgloseCostos = {
    transporte: costoTransporte,
    alojamiento: costoAlojamiento,
    comida: costoComida,
    entradas: costoEntradas,
    actividades: costoActividades,
    total:
      costoTransporte +
      costoAlojamiento +
      costoComida +
      costoEntradas +
      costoActividades,
  };

  return {
    dias: diasSalida,
    costos,
    municipiosInalcanzables: inalcanzables,
    avisos,
  };
}

function buscarTarifa(
  tarifas: TarifaReferencia[],
  concepto: 'alojamiento' | 'comida',
  nivel: Nivel,
): TarifaReferencia | undefined {
  // Preferimos la tarifa regional (municipio_id indefinido) en esta versión.
  return tarifas.find(
    (t) =>
      t.concepto === concepto &&
      t.nivel === nivel &&
      t.municipio_id === undefined,
  );
}

function nombresDeCamino(nodos: string[], nombre: Map<string, string>): string {
  return nodos.map((n) => nombre.get(n) ?? n).join(' → ');
}

function fallo(motivo: MotivoFallo, mensaje: string): ResultadoItinerario {
  return { ok: false, motivo, mensaje };
}
