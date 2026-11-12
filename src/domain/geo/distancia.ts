// Distancia haversine y regla de verificación de check-in (plan.md 6.4).
//
// Estas funciones replican, en el cliente, lo que hace la RPC del servidor
// (supabase/migrations/..._checkins_insignias.sql): misma fórmula haversine y
// misma regla `distancia + precision <= radio`. Mantener ambas iguales permite
// mostrar una vista previa fiel antes de enviar el check-in.

import type { Punto, ResultadoVerificacion } from './tipos';

/** Radio medio de la Tierra en metros (igual que en la función SQL). */
const RADIO_TIERRA_M = 6_371_000;

const aRadianes = (grados: number): number => (grados * Math.PI) / 180;

/**
 * Distancia en metros entre dos puntos por la fórmula del haversine.
 * Determinista y sin dependencias de entorno.
 */
export function distanciaHaversineM(a: Punto, b: Punto): number {
  const dLat = aRadianes(b.lat - a.lat);
  const dLon = aRadianes(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) *
      Math.cos(aRadianes(b.lat)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

/**
 * Decide si un check-in se verificaría (plan.md 6.4).
 *
 * Regla: `distancia + precision <= radio`. Con una precisión peor que el radio
 * nunca se verifica, aunque la distancia sea 0. Es la misma regla del servidor;
 * aquí solo se usa para la vista previa.
 *
 * @param usuario   posición reportada por el dispositivo
 * @param lugar     posición del lugar (atracción o casco del municipio)
 * @param radioM    radio de check-in del lugar, en metros
 * @param precisionM precisión del GPS reportada por el dispositivo, en metros
 */
export function verificarCheckin(
  usuario: Punto,
  lugar: Punto,
  radioM: number,
  precisionM: number,
): ResultadoVerificacion {
  const distanciaM = distanciaHaversineM(usuario, lugar);
  // Una precisión inválida (negativa o no finita) nunca verifica.
  const precisionValida = Number.isFinite(precisionM) && precisionM >= 0;
  const verificado = precisionValida && distanciaM + precisionM <= radioM;
  return { distanciaM, verificado };
}
