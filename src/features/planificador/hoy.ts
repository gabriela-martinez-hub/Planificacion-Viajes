// Fecha de hoy en 'AAAA-MM-DD', zona America/Bogota (plan.md 5.4).
// Se calcula en la UI y se pasa al dominio como dato, para que la lógica siga
// siendo pura (no lee el reloj del sistema).

export function hoyBogota(ahora: Date = new Date()): string {
  // en-CA produce 'AAAA-MM-DD'; el timeZone fija el día civil en Bogotá.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}
