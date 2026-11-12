// Genera los promedios climáticos mensuales del seed (T-25, plan.md 5.1 y 6.3).
//
// Consulta la API histórica (archive) de Open-Meteo para cada uno de los 53
// municipios y agrega 5 años de datos diarios en promedios por mes. Escribe el
// módulo del seed supabase/seed/datos/clima.ts (que consume construirSeed y, de
// ahí, scripts/cargar-seed.ts para cargarlo en Supabase).
//
// Respeta la cuota gratuita de Open-Meteo (10.000 llamadas al día; riesgo R-02):
//   - una sola petición por municipio (5 años diarios, solo 3 variables),
//   - pausa configurable entre peticiones,
//   - resultados parciales guardados en un archivo de progreso JSON,
//   - ejecución reanudable: al reiniciar, salta los municipios ya hechos.
//
// Uso:
//   npx tsx scripts/generar-clima-mensual.ts            genera (reanudable)
//   npx tsx scripts/generar-clima-mensual.ts --reiniciar  ignora el progreso previo
//   npx tsx scripts/generar-clima-mensual.ts --anios 3    cambia la ventana (def. 5)
//   npx tsx scripts/generar-clima-mensual.ts --pausa 1500 ms entre peticiones (def. 1200)
//
// No requiere credenciales de Supabase: solo llama a Open-Meteo (sin API key) y
// escribe archivos locales. La carga a la base es un paso aparte (npm run seed).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { municipios } from '../supabase/seed/datos/municipios';
import { climaMensualSchema } from '../src/domain/catalogo/esquemas';
import { z } from 'zod';

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const AQUI = dirname(fileURLToPath(import.meta.url));
const RUTA_PROGRESO = resolve(
  AQUI,
  '..',
  'supabase',
  'seed',
  '.clima-progreso.json',
);
const RUTA_SALIDA = resolve(
  AQUI,
  '..',
  'supabase',
  'seed',
  'datos',
  'clima.ts',
);

// ------------------------------------------------------------ tipos internos

interface FilaClima {
  municipio_id: string;
  mes: number;
  precip_mm: number;
  dias_lluvia: number;
  prob_lluvia: number;
  temp_min: number;
  temp_max: number;
  temporada_relativa: 'menos_lluviosa' | 'mas_lluviosa';
}

/** Progreso guardado: filas por municipio ya calculadas. */
type Progreso = Record<string, FilaClima[]>;

// ------------------------------------------------------------ utilidades

function parsearArgs(): {
  reiniciar: boolean;
  anios: number;
  pausaMs: number;
} {
  const args = process.argv.slice(2);
  const leer = (bandera: string, def: number): number => {
    const i = args.indexOf(bandera);
    if (i === -1 || i + 1 >= args.length) return def;
    const v = Number(args[i + 1]);
    return Number.isFinite(v) && v > 0 ? v : def;
  };
  return {
    reiniciar: args.includes('--reiniciar'),
    anios: leer('--anios', 5),
    pausaMs: leer('--pausa', 1200),
  };
}

function dormir(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function cargarProgreso(): Progreso {
  if (!existsSync(RUTA_PROGRESO)) return {};
  try {
    return JSON.parse(readFileSync(RUTA_PROGRESO, 'utf8')) as Progreso;
  } catch {
    console.warn('⚠ No se pudo leer el progreso previo; se empieza de cero.');
    return {};
  }
}

function guardarProgreso(p: Progreso): void {
  writeFileSync(RUTA_PROGRESO, JSON.stringify(p, null, 2), 'utf8');
}

/** Rango [start_date, end_date] de `anios` años completos hasta el 31 de dic pasado. */
function rangoFechas(anios: number): { inicio: string; fin: string } {
  const hoy = new Date();
  const anioFin = hoy.getUTCFullYear() - 1; // último año completo
  const anioInicio = anioFin - anios + 1;
  return {
    inicio: `${anioInicio}-01-01`,
    fin: `${anioFin}-12-31`,
  };
}

// ------------------------------------------------------------ API histórica

const archivoSchema = z.object({
  daily: z.object({
    time: z.array(z.string()),
    precipitation_sum: z.array(z.number().nullable()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
  }),
});

interface SerieDiaria {
  fechas: string[];
  precip: (number | null)[];
  tmax: (number | null)[];
  tmin: (number | null)[];
}

async function pedirHistorico(
  lat: number,
  lon: number,
  inicio: string,
  fin: string,
): Promise<SerieDiaria> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: inicio,
    end_date: fin,
    daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min',
    timezone: 'America/Bogota',
  });
  const url = `${ARCHIVE_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Open-Meteo archive respondió ${res.status} para ${lat},${lon}`,
    );
  }
  const datos = archivoSchema.parse(await res.json());
  return {
    fechas: datos.daily.time,
    precip: datos.daily.precipitation_sum,
    tmax: datos.daily.temperature_2m_max,
    tmin: datos.daily.temperature_2m_min,
  };
}

// ------------------------------------------------------------ agregación mensual

/** Día de lluvia: precipitación >= 1 mm (plan.md 6.3). */
const UMBRAL_DIA_LLUVIA_MM = 1;

/** Días del mes (sin año bisiesto para la normalización de prob_lluvia). */
const DIAS_DEL_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function redondear(n: number, dec: number): number {
  const f = 10 ** dec;
  return Math.round(n * f) / f;
}

/**
 * Agrega una serie diaria de varios años en 12 filas mensuales. Para cada mes:
 * - precip_mm: precipitación total mensual promedio entre los años.
 * - dias_lluvia: número promedio de días con >= 1 mm por mes.
 * - prob_lluvia: dias_lluvia / días del mes (acotado a [0, 1]).
 * - temp_min / temp_max: promedio de las mínimas / máximas diarias del mes.
 * - temporada_relativa: respecto a la mediana anual de prob_lluvia del municipio.
 */
function agregarPorMes(municipioId: string, serie: SerieDiaria): FilaClima[] {
  // Acumuladores por mes (1-12).
  const precipPorMesAnio = new Map<string, number>(); // "mes-anio" -> suma precip
  const diasLluviaPorMesAnio = new Map<string, number>();
  const aniosPorMes = new Map<number, Set<number>>();
  const sumaTmax = new Map<number, number>();
  const sumaTmin = new Map<number, number>();
  const cuentaTemp = new Map<number, number>();

  for (let i = 0; i < serie.fechas.length; i++) {
    const fecha = serie.fechas[i];
    const mes = Number(fecha.slice(5, 7));
    const anio = Number(fecha.slice(0, 4));
    const clave = `${mes}-${anio}`;

    const p = serie.precip[i];
    if (p !== null) {
      precipPorMesAnio.set(clave, (precipPorMesAnio.get(clave) ?? 0) + p);
      if (p >= UMBRAL_DIA_LLUVIA_MM) {
        diasLluviaPorMesAnio.set(
          clave,
          (diasLluviaPorMesAnio.get(clave) ?? 0) + 1,
        );
      }
    }
    const set = aniosPorMes.get(mes) ?? new Set<number>();
    set.add(anio);
    aniosPorMes.set(mes, set);

    const tmax = serie.tmax[i];
    const tmin = serie.tmin[i];
    if (tmax !== null && tmin !== null) {
      sumaTmax.set(mes, (sumaTmax.get(mes) ?? 0) + tmax);
      sumaTmin.set(mes, (sumaTmin.get(mes) ?? 0) + tmin);
      cuentaTemp.set(mes, (cuentaTemp.get(mes) ?? 0) + 1);
    }
  }

  // Promedios por mes entre los años disponibles.
  const filasPrevias: Omit<FilaClima, 'temporada_relativa'>[] = [];
  for (let mes = 1; mes <= 12; mes++) {
    const anios = aniosPorMes.get(mes);
    if (!anios || anios.size === 0) continue;
    const n = anios.size;

    let sumaPrecip = 0;
    let sumaDiasLluvia = 0;
    for (const anio of anios) {
      sumaPrecip += precipPorMesAnio.get(`${mes}-${anio}`) ?? 0;
      sumaDiasLluvia += diasLluviaPorMesAnio.get(`${mes}-${anio}`) ?? 0;
    }
    const precipMedia = sumaPrecip / n;
    const diasLluviaMedia = sumaDiasLluvia / n;
    const probLluvia = Math.min(
      1,
      Math.max(0, diasLluviaMedia / DIAS_DEL_MES[mes - 1]),
    );
    const cT = cuentaTemp.get(mes) ?? 1;

    filasPrevias.push({
      municipio_id: municipioId,
      mes,
      precip_mm: redondear(precipMedia, 1),
      dias_lluvia: redondear(diasLluviaMedia, 1),
      prob_lluvia: redondear(probLluvia, 3),
      temp_min: redondear((sumaTmin.get(mes) ?? 0) / cT, 1),
      temp_max: redondear((sumaTmax.get(mes) ?? 0) / cT, 1),
    });
  }

  // temporada_relativa respecto a la mediana anual de prob_lluvia del municipio.
  const probs = filasPrevias.map((f) => f.prob_lluvia).sort((a, b) => a - b);
  const mediana =
    probs.length === 0
      ? 0
      : probs.length % 2 === 1
        ? probs[(probs.length - 1) / 2]
        : (probs[probs.length / 2 - 1] + probs[probs.length / 2]) / 2;

  return filasPrevias.map((f) => ({
    ...f,
    temporada_relativa:
      f.prob_lluvia >= mediana
        ? ('mas_lluviosa' as const)
        : ('menos_lluviosa' as const),
  }));
}

// ------------------------------------------------------------ salida

/** Escribe el módulo TS del seed con las filas ya validadas. */
function escribirSeed(filas: FilaClima[]): void {
  const ordenadas = [...filas].sort(
    (a, b) => a.municipio_id.localeCompare(b.municipio_id) || a.mes - b.mes,
  );
  const cuerpo = ordenadas
    .map(
      (f) =>
        `  {\n` +
        `    municipio_id: '${f.municipio_id}',\n` +
        `    mes: ${f.mes},\n` +
        `    precip_mm: ${f.precip_mm},\n` +
        `    dias_lluvia: ${f.dias_lluvia},\n` +
        `    prob_lluvia: ${f.prob_lluvia},\n` +
        `    temp_min: ${f.temp_min},\n` +
        `    temp_max: ${f.temp_max},\n` +
        `    temporada_relativa: '${f.temporada_relativa}',\n` +
        `  },`,
    )
    .join('\n');

  const contenido = `// Promedios climáticos mensuales por municipio (plan.md 5.1, 6.3).
//
// ARCHIVO GENERADO por scripts/generar-clima-mensual.ts (T-25). No editar a mano:
// vuelve a correr \`npx tsx scripts/generar-clima-mensual.ts\` para regenerarlo.
//
// Fuente: API histórica de Open-Meteo (archive), promedios de varios años.
// "Weather data by Open-Meteo.com" (CC BY 4.0). dias_lluvia cuenta días con
// precipitación >= 1 mm; prob_lluvia = dias_lluvia / días del mes;
// temporada_relativa compara cada mes con la mediana anual del municipio.
import type { ClimaMensual } from '../../../src/domain/catalogo/esquemas';

export const climaMensual: ClimaMensual[] = [
${cuerpo}
];
`;
  writeFileSync(RUTA_SALIDA, contenido, 'utf8');
}

// ------------------------------------------------------------ main

async function main(): Promise<void> {
  const { reiniciar, anios, pausaMs } = parsearArgs();
  const { inicio, fin } = rangoFechas(anios);
  console.log(
    `Generando clima mensual de ${municipios.length} municipios ` +
      `(${anios} años: ${inicio}..${fin}, pausa ${pausaMs} ms).`,
  );

  const progreso = reiniciar ? {} : cargarProgreso();
  if (reiniciar) console.log('Modo --reiniciar: se ignora el progreso previo.');

  let hechos = 0;
  let nuevos = 0;
  for (const m of municipios) {
    if (progreso[m.id] && progreso[m.id].length > 0) {
      hechos++;
      continue; // ya calculado en una corrida anterior
    }
    try {
      const serie = await pedirHistorico(m.lat, m.lon, inicio, fin);
      const filas = agregarPorMes(m.id, serie);
      // Validamos cada fila con Zod antes de guardarla (datos verificables).
      filas.forEach((f) => climaMensualSchema.parse(f));
      progreso[m.id] = filas;
      guardarProgreso(progreso); // resultado parcial, reanudable
      nuevos++;
      hechos++;
      console.log(
        `  ✓ ${m.id} (${filas.length} meses) [${hechos}/${municipios.length}]`,
      );
    } catch (e) {
      console.error(
        `  ✗ ${m.id}: ${e instanceof Error ? e.message : String(e)}. ` +
          'Se puede reanudar volviendo a ejecutar el script.',
      );
      // Paramos para no quemar cuota ante un error sistemático; el progreso
      // ya está guardado y la próxima corrida continúa donde quedó.
      break;
    }
    await dormir(pausaMs);
  }

  const todas = Object.values(progreso).flat();
  escribirSeed(todas);

  console.log(
    `\n${nuevos} municipios nuevos en esta corrida; ${hechos}/${municipios.length} en total. ` +
      `Seed escrito con ${todas.length} filas en supabase/seed/datos/clima.ts.`,
  );
  if (hechos < municipios.length) {
    console.log(
      'Faltan municipios: vuelve a ejecutar el script para continuar (es reanudable).',
    );
  } else {
    console.log('Completo. Ahora carga a Supabase con: npm run seed');
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
