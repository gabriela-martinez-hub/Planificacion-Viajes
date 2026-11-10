// Utilidades de fecha puras para el generador (plan.md 5.4: zona America/Bogota).
//
// Las fechas del viaje son cadenas 'AAAA-MM-DD'. Se tratan como fechas civiles,
// sin hora ni zona: la aritmética se hace en UTC para evitar desfases por el
// huso horario del entorno de ejecución.

/** Convierte 'AAAA-MM-DD' a un entero de días (epoch en UTC). Lanza si es inválida. */
function aDias(fecha: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) throw new Error(`Fecha inválida: ${fecha}`);
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.floor(ms / 86_400_000);
}

/** Días calendario entre dos fechas inclusive: 'AAAA-MM-DD' .. 'AAAA-MM-DD'. */
export function diasEntre(inicio: string, fin: string): number {
  return aDias(fin) - aDias(inicio) + 1;
}

/** true si `fin` es anterior a `inicio`. */
export function finAntesDeInicio(inicio: string, fin: string): boolean {
  return aDias(fin) < aDias(inicio);
}

/** Lista de fechas 'AAAA-MM-DD' desde `inicio` durante `cantidad` días. */
export function fechasDelViaje(inicio: string, cantidad: number): string[] {
  const base = aDias(inicio);
  const salida: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const d = new Date((base + i) * 86_400_000);
    const y = d.getUTCFullYear();
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(d.getUTCDate()).padStart(2, '0');
    salida.push(`${y}-${mes}-${dia}`);
  }
  return salida;
}

/** Día de la semana (0 = domingo … 6 = sábado) de una fecha 'AAAA-MM-DD'. */
export function diaSemana(fecha: string): number {
  return new Date(aDias(fecha) * 86_400_000).getUTCDay();
}
