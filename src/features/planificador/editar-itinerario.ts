// Ediciones del itinerario en memoria (T-13): subir/bajar y fijar/soltar ítems
// dentro de un día. Funciones puras que devuelven un itinerario nuevo (no mutan
// el de entrada), para encajar con el estado de React.
//
// La persistencia y la regeneración respetando ítems fijados se harán en T-14;
// aquí solo se manipula el itinerario ya generado.

import type {
  DiaItinerario,
  Itinerario,
  ItemItinerario,
} from '@/domain/itinerario';

function renumerar(items: ItemItinerario[]): ItemItinerario[] {
  return items.map((it, i) => ({ ...it, orden: i + 1 }));
}

function mapearDia(
  itinerario: Itinerario,
  dia: number,
  fn: (items: ItemItinerario[]) => ItemItinerario[],
): Itinerario {
  const dias = itinerario.dias.map((d): DiaItinerario =>
    d.dia === dia ? { ...d, items: renumerar(fn(d.items)) } : d,
  );
  return { ...itinerario, dias };
}

/** Sube un ítem una posición dentro de su día (intercambio con el anterior). */
export function subirItem(
  itinerario: Itinerario,
  dia: number,
  orden: number,
): Itinerario {
  return mapearDia(itinerario, dia, (items) => {
    const i = items.findIndex((it) => it.orden === orden);
    if (i <= 0) return items;
    const copia = [...items];
    [copia[i - 1], copia[i]] = [copia[i], copia[i - 1]];
    return copia;
  });
}

/** Baja un ítem una posición dentro de su día (intercambio con el siguiente). */
export function bajarItem(
  itinerario: Itinerario,
  dia: number,
  orden: number,
): Itinerario {
  return mapearDia(itinerario, dia, (items) => {
    const i = items.findIndex((it) => it.orden === orden);
    if (i === -1 || i >= items.length - 1) return items;
    const copia = [...items];
    [copia[i], copia[i + 1]] = [copia[i + 1], copia[i]];
    return copia;
  });
}

/** Alterna el estado `fijado` de un ítem. */
export function alternarFijado(
  itinerario: Itinerario,
  dia: number,
  orden: number,
): Itinerario {
  return mapearDia(itinerario, dia, (items) =>
    items.map((it) =>
      it.orden === orden ? { ...it, fijado: !it.fijado } : it,
    ),
  );
}

/**
 * Lista ordenada de municipios base distintos del itinerario, en el orden en
 * que aparecen por día. Es el orden de destinos que el usuario puede reordenar.
 */
export function ordenDestinos(itinerario: Itinerario): string[] {
  const vistos = new Set<string>();
  const orden: string[] = [];
  for (const d of itinerario.dias) {
    if (!vistos.has(d.municipioBaseId)) {
      vistos.add(d.municipioBaseId);
      orden.push(d.municipioBaseId);
    }
  }
  return orden;
}

/** Mueve un destino una posición en la lista (intercambio). Devuelve el orden nuevo. */
export function moverDestino(
  orden: string[],
  municipioId: string,
  direccion: 'arriba' | 'abajo',
): string[] {
  const i = orden.indexOf(municipioId);
  if (i === -1) return orden;
  const j = direccion === 'arriba' ? i - 1 : i + 1;
  if (j < 0 || j >= orden.length) return orden;
  const copia = [...orden];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}
