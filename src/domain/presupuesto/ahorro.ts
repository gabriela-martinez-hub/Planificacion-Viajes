// Modo "viaje soñado": meta de ahorro y cuota (plan.md 6.2 modo soñado). Puro.
//
// No lee el reloj del sistema: recibe `hoy` como parámetro ('AAAA-MM-DD', zona
// America/Bogota). La cuota NO se guarda, se calcula (plan.md 5.2):
//   periodos = semanas o meses completos entre hoy y fecha_inicio
//   cuota    = max(0, ceil((meta - ahorrado) / max(1, periodos)))
// Si fecha_inicio <= hoy: "meta vencida" (sin cuota).
// Si ahorrado >= meta: "meta cumplida".

import {
  finAntesDeInicio,
  mesesEntre,
  semanasEntre,
} from '../itinerario/fechas';

export type FrecuenciaAhorro = 'semanal' | 'mensual';

export interface Aporte {
  fecha: string;
  montoCop: number;
}

export type EstadoMeta = 'activa' | 'cumplida' | 'vencida';

export interface ResultadoAhorro {
  estado: EstadoMeta;
  /** Suma de los aportes registrados, en COP. */
  ahorrado: number;
  /** Monto que falta para la meta (0 si ya se cumplió). */
  restante: number;
  /** Periodos completos (semanas o meses) entre hoy y la fecha del viaje. */
  periodos: number;
  /** Cuota sugerida por periodo, en COP. 0 si vencida o cumplida. */
  cuota: number;
  /** Progreso 0..1 para la barra (ahorrado / meta, acotado a 1). */
  progreso: number;
}

export interface EntradaAhorro {
  /** Monto objetivo del viaje (metas_ahorro.monto_objetivo_cop). */
  metaCop: number;
  frecuencia: FrecuenciaAhorro;
  /** Fecha de inicio del viaje 'AAAA-MM-DD'. */
  fechaInicio: string;
  /** Fecha de hoy 'AAAA-MM-DD' (America/Bogota), inyectada por quien llama. */
  hoy: string;
  /** Aportes registrados. */
  aportes: Aporte[];
}

/** Suma de los aportes (ignora montos no positivos por seguridad). */
export function totalAportado(aportes: Aporte[]): number {
  return aportes.reduce((s, a) => s + (a.montoCop > 0 ? a.montoCop : 0), 0);
}

/**
 * Calcula el estado de la meta y la cuota sugerida (plan.md 6.2). Determinista
 * y sin división por cero (`max(1, periodos)`), ni cuota negativa (`max(0, …)`).
 */
export function calcularAhorro(entrada: EntradaAhorro): ResultadoAhorro {
  const meta = Math.max(0, Math.floor(entrada.metaCop));
  const ahorrado = totalAportado(entrada.aportes);
  const restante = Math.max(0, meta - ahorrado);
  const progreso = meta > 0 ? Math.min(1, ahorrado / meta) : 1;

  // Meta cumplida: el ahorro alcanza o supera la meta.
  if (meta > 0 && ahorrado >= meta) {
    return {
      estado: 'cumplida',
      ahorrado,
      restante: 0,
      periodos: 0,
      cuota: 0,
      progreso: 1,
    };
  }

  // Meta vencida: la fecha del viaje ya pasó o es hoy (fecha_inicio <= hoy).
  // `finAntesDeInicio(fechaInicio, hoy)` es true cuando hoy < fechaInicio, es
  // decir, cuando el viaje aún no ha llegado y la meta sigue activa.
  const hoyAntesDelViaje = finAntesDeInicio(entrada.fechaInicio, entrada.hoy);
  if (!hoyAntesDelViaje) {
    return {
      estado: 'vencida',
      ahorrado,
      restante,
      periodos: 0,
      cuota: 0,
      progreso,
    };
  }

  const periodos =
    entrada.frecuencia === 'semanal'
      ? semanasEntre(entrada.hoy, entrada.fechaInicio)
      : mesesEntre(entrada.hoy, entrada.fechaInicio);

  const cuota = Math.max(0, Math.ceil(restante / Math.max(1, periodos)));
  return { estado: 'activa', ahorrado, restante, periodos, cuota, progreso };
}
