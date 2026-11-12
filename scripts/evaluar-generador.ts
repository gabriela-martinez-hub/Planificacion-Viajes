// Evalúa el generador de itinerarios y escribe el informe (T-27, plan.md 6.0).
//
// Corre el banco de instancias con las tres estrategias (voraz, voraz + búsqueda
// local y fuerza bruta en las pequeñas) y genera el informe Markdown en
// src/domain/itinerario/instancias/INFORME.md.
//
// Uso:
//   npm run evaluar          (escribe el informe)
//   npm run evaluar -- --print   (además lo imprime en consola)
//
// Es puro y determinista salvo la medición de tiempo. No toca la red ni la base.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  evaluarTodas,
  resumir,
} from '../src/domain/itinerario/instancias/evaluar';
import { generarInforme } from '../src/domain/itinerario/instancias/informe';

function fechaHoy(): string {
  // Fecha civil AAAA-MM-DD en zona America/Bogota (plan.md 5.4).
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function main(): void {
  const resultados = evaluarTodas();
  const resumen = resumir(resultados);
  const informe = generarInforme(resultados, resumen, fechaHoy());

  const aqui = dirname(fileURLToPath(import.meta.url));
  const destino = resolve(
    aqui,
    '..',
    'src',
    'domain',
    'itinerario',
    'instancias',
    'INFORME.md',
  );
  writeFileSync(destino, informe, 'utf8');

  console.log(`✓ Informe escrito en ${destino}`);
  console.log(
    `  ${resumen.total} instancias, ${resumen.conViolaciones} con violaciones, ` +
      `${resumen.optimasCount}/${resumen.aptasCount} en el óptimo, ` +
      `dif. abs. máx ${resumen.brechaAbsMax.toFixed(2)}, ` +
      `tiempo máx ${resumen.tiempoMaxMs.toFixed(2)} ms`,
  );

  if (process.argv.includes('--print')) {
    console.log('\n' + informe);
  }
}

main();
