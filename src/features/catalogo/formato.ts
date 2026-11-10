// Utilidades de formato para el catálogo: moneda COP y días de la semana.
// La moneda se formatea con Intl y el locale es-CO (plan.md 3, 6.2).

const DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const;

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Formatea un monto entero en COP, p. ej. 65000 -> "$ 65.000". */
export function formatearCOP(valor: number): string {
  return formatoCOP.format(valor);
}

/** Convierte [1, 2] en "lunes, martes". Índices 0 (domingo) a 6 (sábado). */
export function nombresDias(indices: number[]): string {
  return indices
    .filter((i) => i >= 0 && i <= 6)
    .map((i) => DIAS[i])
    .join(', ');
}

/** Recorta 'HH:MM:SS' a 'HH:MM' para mostrar. */
export function soloHoraMin(hora: string): string {
  return hora.slice(0, 5);
}
