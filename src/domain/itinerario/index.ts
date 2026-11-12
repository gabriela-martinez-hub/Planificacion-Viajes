// Punto de entrada del generador de itinerario (plan.md 6.1).
//
// `generarItinerario` corre la construcción voraz (pasos 1-6) y la búsqueda
// local (paso 7). El presupuesto (paso 8) y el reordenamiento por clima
// (paso 9) son fases posteriores (T-15 y T-18) y no se ejecutan aquí.

import type { Catalogo } from '../catalogo/esquemas';
import { generarItinerario as construir } from './generador';
import { buscarLocal } from './busqueda-local';
import type {
  CatalogoItinerario,
  EntradaItinerario,
  ResultadoItinerario,
} from './tipos';

export * from './tipos';
export { GrafoBuses } from './grafo-buses';
export { puntuar, costoAtraccion, compararAtracciones } from './puntuacion';
export { reorganizarPorClima } from './reorganizar-clima';
export type {
  OpcionesReorganizar,
  ResultadoReorganizar,
} from './reorganizar-clima';

/**
 * Genera un itinerario: construcción voraz + búsqueda local. Nunca lanza por
 * datos de usuario; devuelve un resultado tipado ok/no-ok.
 */
export function generarItinerario(
  entrada: EntradaItinerario,
): ResultadoItinerario {
  const resultado = construir(entrada);
  if (!resultado.ok) return resultado;
  const mejorado = buscarLocal(resultado.itinerario, {
    atracciones: entrada.catalogo.atracciones,
    pesoLluvia: entrada.pesoLluvia,
    limiteJornadaMin: entrada.limiteJornadaMin || 540,
  });
  return { ok: true, itinerario: mejorado };
}

/**
 * Construye el subconjunto de catálogo que necesita el generador a partir del
 * catálogo completo validado con Zod (el que produce construirSeed o la lectura
 * de Supabase).
 */
export function catalogoParaItinerario(catalogo: Catalogo): CatalogoItinerario {
  return {
    municipios: catalogo.municipios,
    origenesExternos: catalogo.origenes_externos,
    atracciones: catalogo.atracciones,
    rutasBus: catalogo.rutas_bus,
    tarifas: catalogo.tarifas_referencia,
  };
}
