// Utilidad de geolocalización del navegador para el check-in (plan.md 6.4).
// Pide una posición NUEVA (maximumAge: 0) para no usar una lectura vieja.

export interface PosicionActual {
  lat: number;
  lon: number;
  /** Precisión horizontal en metros reportada por el dispositivo. */
  precisionM: number;
}

export type ErrorUbicacion =
  | 'no_soportada' // el navegador no tiene geolocalización
  | 'contexto_inseguro' // la página no es HTTPS ni localhost
  | 'permiso_denegado' // el usuario rechazó el permiso
  | 'no_disponible' // el dispositivo no pudo obtener la posición
  | 'tiempo_agotado'; // se agotó el tiempo de espera

export class ErrorGeolocalizacion extends Error {
  constructor(
    public readonly motivo: ErrorUbicacion,
    /** Mensaje nativo del navegador, útil para depurar. */
    public readonly detalle?: string,
  ) {
    super(detalle ? `${motivo}: ${detalle}` : motivo);
    this.name = 'ErrorGeolocalizacion';
  }
}

/**
 * Obtiene la posición actual del dispositivo. Rechaza con ErrorGeolocalizacion
 * cuyo `motivo` permite mostrar el mensaje adecuado.
 *
 * La API de geolocalización solo funciona en un contexto seguro (HTTPS o
 * localhost). Si abres la app por una IP de red (p. ej. 192.168.x.x), el
 * navegador la bloquea: usa http://localhost:5173.
 */
export function obtenerPosicionActual(
  tiempoMaxMs = 15_000,
): Promise<PosicionActual> {
  return new Promise((resolver, rechazar) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      rechazar(new ErrorGeolocalizacion('no_soportada'));
      return;
    }
    // Contexto seguro: sin él, el navegador rechaza sin diálogo de permiso.
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      rechazar(
        new ErrorGeolocalizacion(
          'contexto_inseguro',
          'La geolocalización requiere HTTPS o localhost.',
        ),
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolver({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          precisionM: pos.coords.accuracy,
        }),
      (err) => {
        const motivo: ErrorUbicacion =
          err.code === err.PERMISSION_DENIED
            ? 'permiso_denegado'
            : err.code === err.TIMEOUT
              ? 'tiempo_agotado'
              : 'no_disponible';
        // Dejamos el mensaje nativo en consola para depurar en el navegador.
        if (typeof console !== 'undefined') {
          console.warn('[geolocalizacion]', motivo, '-', err.message);
        }
        rechazar(new ErrorGeolocalizacion(motivo, err.message));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: tiempoMaxMs },
    );
  });
}
