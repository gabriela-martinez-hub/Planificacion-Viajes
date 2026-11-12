// Evaluación del generador sobre el banco de instancias (plan.md 6.0, T-27).
//
// Compara tres estrategias en igualdad de condiciones:
//   - voraz: solo la construcción voraz (generador.ts, pasos 1-6),
//   - voraz+local: voraz seguida de búsqueda local (index.ts, pasos 1-7),
//   - fuerza bruta: óptimo exacto en instancias pequeñas (fuerza-bruta.ts).
//
// Métricas por instancia (plan.md 6.0):
//   - valor del objetivo (objetivo.ts),
//   - violaciones de restricciones (deben ser 0),
//   - % del presupuesto usado (si la instancia fija presupuesto; aquí
//     reportamos el costo total como referencia),
//   - brecha de optimalidad frente a la fuerza bruta (solo instancias aptas),
//   - tiempo de ejecución en milisegundos.
//
// Todo es puro y determinista salvo la medición de tiempo (performance.now()),
// que no afecta al resultado, solo a la métrica de rendimiento.

import { generarItinerario as construirVoraz } from '../generador';
import { generarItinerario as construirVorazLocal } from '../index';
import { calcularObjetivo, verificarRestricciones } from './objetivo';
import { optimoFuerzaBruta } from './fuerza-bruta';
import { INSTANCIAS, type Instancia } from './casos';

export interface MetricasEstrategia {
  factible: boolean;
  objetivo: number;
  violaciones: number;
  costoTotal: number;
  tiempoMs: number;
}

export interface ResultadoInstancia {
  nombre: string;
  descripcion: string;
  esperaFallo: boolean;
  aptaFuerzaBruta: boolean;
  voraz: MetricasEstrategia;
  vorazLocal: MetricasEstrategia;
  /** Óptimo por fuerza bruta (solo instancias aptas). */
  objetivoOptimo?: number;
  /** Brecha de optimalidad de voraz+local: (óptimo − obj) / |óptimo|. */
  brechaOptimalidad?: number;
  /** true si voraz+local no empeora el objetivo frente a voraz. */
  localNoEmpeora: boolean;
}

function ahora(): number {
  // performance.now si existe; si no, Date.now (suficiente para el informe).
  return typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
}

/** Corre una estrategia y recoge sus métricas. */
function medir(
  instancia: Instancia,
  generar: typeof construirVoraz,
): MetricasEstrategia {
  const t0 = ahora();
  const r = generar(instancia.entrada);
  const tiempoMs = ahora() - t0;

  if (!r.ok) {
    return {
      factible: false,
      objetivo: 0,
      violaciones: 0,
      costoTotal: 0,
      tiempoMs,
    };
  }
  const obj = calcularObjetivo(
    r.itinerario,
    instancia.entrada,
    instancia.entrada.catalogo.atracciones,
  );
  const violaciones = verificarRestricciones(r.itinerario, instancia.entrada);
  return {
    factible: true,
    objetivo: obj.valor,
    violaciones: violaciones.length,
    costoTotal: r.itinerario.costos.total,
    tiempoMs,
  };
}

/** Evalúa una instancia con las tres estrategias. */
export function evaluarInstancia(instancia: Instancia): ResultadoInstancia {
  const voraz = medir(instancia, construirVoraz);
  const vorazLocal = medir(instancia, construirVorazLocal);

  const resultado: ResultadoInstancia = {
    nombre: instancia.nombre,
    descripcion: instancia.descripcion,
    esperaFallo: instancia.esperaFallo ?? false,
    aptaFuerzaBruta: instancia.aptaFuerzaBruta,
    voraz,
    vorazLocal,
    localNoEmpeora: vorazLocal.objetivo >= voraz.objetivo - 1e-9,
  };

  if (instancia.aptaFuerzaBruta && !instancia.esperaFallo) {
    const { objetivoOptimo } = optimoFuerzaBruta(instancia.entrada);
    resultado.objetivoOptimo = objetivoOptimo;
    const denom =
      Math.abs(objetivoOptimo) > 1e-9 ? Math.abs(objetivoOptimo) : 1;
    resultado.brechaOptimalidad =
      (objetivoOptimo - vorazLocal.objetivo) / denom;
  }

  return resultado;
}

/** Evalúa todas las instancias del banco. */
export function evaluarTodas(): ResultadoInstancia[] {
  return INSTANCIAS.map(evaluarInstancia);
}

export interface ResumenEvaluacion {
  total: number;
  conViolaciones: number;
  vorazLocalMejoraCount: number;
  /** Nº de instancias donde voraz+local alcanza el óptimo exacto (brecha ~ 0). */
  optimasCount: number;
  /** Nº de instancias pequeñas (con óptimo calculado). */
  aptasCount: number;
  /** Instancias pequeñas donde la heurística NO alcanzó el óptimo. */
  noOptimas: {
    nombre: string;
    objetivo: number;
    optimo: number;
    diferencia: number;
  }[];
  /** Mayor diferencia absoluta de objetivo (óptimo − voraz+local). */
  brechaAbsMax: number;
  tiempoMaxMs: number;
  tiempoPromedioMs: number;
}

export function resumir(resultados: ResultadoInstancia[]): ResumenEvaluacion {
  const conBrecha = resultados.filter(
    (r) => r.brechaOptimalidad !== undefined && r.objetivoOptimo !== undefined,
  );
  const brechasAbs = conBrecha.map(
    (r) => r.objetivoOptimo! - r.vorazLocal.objetivo,
  );
  const optimasCount = conBrecha.filter(
    (r) => Math.abs(r.objetivoOptimo! - r.vorazLocal.objetivo) < 1e-6,
  ).length;
  const noOptimas = conBrecha
    .filter((r) => Math.abs(r.objetivoOptimo! - r.vorazLocal.objetivo) >= 1e-6)
    .map((r) => ({
      nombre: r.nombre,
      objetivo: r.vorazLocal.objetivo,
      optimo: r.objetivoOptimo!,
      diferencia: r.objetivoOptimo! - r.vorazLocal.objetivo,
    }));
  const tiempos = resultados.map((r) => r.vorazLocal.tiempoMs);
  const conViolaciones = resultados.filter(
    (r) => r.voraz.violaciones > 0 || r.vorazLocal.violaciones > 0,
  ).length;
  const vorazLocalMejoraCount = resultados.filter(
    (r) => r.vorazLocal.objetivo > r.voraz.objetivo + 1e-9,
  ).length;

  return {
    total: resultados.length,
    conViolaciones,
    vorazLocalMejoraCount,
    optimasCount,
    aptasCount: conBrecha.length,
    noOptimas,
    brechaAbsMax: brechasAbs.length > 0 ? Math.max(...brechasAbs) : 0,
    tiempoMaxMs: tiempos.length > 0 ? Math.max(...tiempos) : 0,
    tiempoPromedioMs:
      tiempos.length > 0
        ? tiempos.reduce((s, t) => s + t, 0) / tiempos.length
        : 0,
  };
}
