// Viaje pendiente de guardar a través del login (T-14, pieza A).
//
// El login con Google (OAuth) recarga la página completa, lo que borra el
// itinerario que vive en el estado de React. Para no perderlo, antes de iniciar
// sesión se guarda aquí (en sessionStorage) y, al volver ya con sesión, el
// planificador lo recupera y ofrece guardarlo en la cuenta.
//
// Se usa sessionStorage (no IndexedDB): sobrevive al redirect de OAuth porque es
// la misma pestaña y el mismo origen, y se limpia solo al cerrar la pestaña.
// Esto NO es el "guardado local sin cuenta" que se difirió (plan.md 1.3): es un
// puente efímero para no perder el trabajo durante el login.

import type { Itinerario } from '@/domain/itinerario';
import type { FormularioViaje } from '@/domain/viaje/esquemas';

const CLAVE = 'viaje-pendiente';

export interface ViajePendiente {
  formulario: FormularioViaje;
  itinerario: Itinerario;
}

/** Guarda el viaje pendiente antes de iniciar sesión. */
export function guardarPendiente(datos: ViajePendiente): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // Si sessionStorage no está disponible, no bloqueamos el login; solo se
    // pierde el puente (el usuario tendría que regenerar).
  }
}

/** Devuelve el viaje pendiente, o null si no hay. */
export function leerPendiente(): ViajePendiente | null {
  try {
    const bruto = sessionStorage.getItem(CLAVE);
    if (!bruto) return null;
    return JSON.parse(bruto) as ViajePendiente;
  } catch {
    return null;
  }
}

/** Borra el viaje pendiente (tras guardarlo o descartarlo). */
export function borrarPendiente(): void {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer si falla.
  }
}
