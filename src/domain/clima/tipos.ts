// Tipos del dominio de clima (plan.md 6.3).
//
// El dominio de clima es puro: clasifica días como lluviosos o secos a partir
// de un pronóstico (Open-Meteo) o de los promedios mensuales del seed, sin leer
// la red ni la hora del sistema. El servicio (services/clima.ts) obtiene los
// datos crudos; aquí solo se interpretan.

/** Umbrales para decidir si un día es lluvioso (plan.md 6.3). Configurables. */
export interface UmbralesLluvia {
  /** Probabilidad de lluvia (0 a 1) a partir de la cual el día es lluvioso. */
  probabilidadMin: number;
  /** Precipitación en mm a partir de la cual el día es lluvioso (solo pronóstico). */
  precipitacionMinMm: number;
}

/** Umbrales por defecto: prob ≥ 60 % o precipitación ≥ 5 mm (plan.md 6.3). */
export const UMBRALES_POR_DEFECTO: UmbralesLluvia = {
  probabilidadMin: 0.6,
  precipitacionMinMm: 5,
};

/** Origen del dato climático de un día. */
export type FuenteClima =
  | 'pronostico' // Open-Meteo, dentro del horizonte (días 1-7)
  | 'tendencia' // Open-Meteo, días 8-16 (menos fiable)
  | 'promedio'; // clima_mensual del seed (fuera del horizonte o sin red)

/** Pronóstico diario de Open-Meteo para una fecha y lugar. */
export interface PronosticoDia {
  fecha: string; // 'AAAA-MM-DD'
  precipitacionMm: number;
  /** Probabilidad máxima de precipitación, 0 a 100 (como la da Open-Meteo). */
  probabilidadPct: number;
  tempMin: number;
  tempMax: number;
}

/** Clima de un día ya interpretado, con su origen y si es lluvioso. */
export interface ClimaDiaDetalle {
  fecha: string;
  lluvioso: boolean;
  fuente: FuenteClima;
  /** Probabilidad de lluvia 0 a 1 (normalizada), para mostrar al usuario. */
  probabilidadLluvia: number;
  tempMin?: number;
  tempMax?: number;
}
