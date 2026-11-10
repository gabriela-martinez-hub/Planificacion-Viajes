// Grafo de rutas de bus directas entre cabeceras (plan.md 5.1, 6.1, 7).
// Solo tramos directos reales por los corredores principales. El generador
// recorre el grafo con Dijkstra; aquí basta con tramos directos.
//
// Las rutas se declaran una sola vez y se asumen en ambos sentidos: el helper
// `tramo` genera la arista de ida y vuelta con la misma tarifa y tiempo (los
// buses intermunicipales de la región cobran parecido en ambos sentidos).
//
// Nota de alcance (R-04): tiempos y tarifas son de referencia, con
// costo_aproximado=true. El usuario debe revisarlos antes de la sustentación.
// El diseño del grafo garantiza que los 53 municipios queden conectados entre
// sí (criterio de aceptación de F-a); lo verifica analizarConectividadBus.
import type { RutaBusSeed } from '../../../src/domain/catalogo/esquemas';

const REV = '2026-11-10';
const FUENTE =
  'Seed académico Eje Cafetero: tiempos y tarifas de bus de referencia; verificar antes de usar';

interface Def {
  de: string;
  a: string;
  min: number;
  km: number;
  tarifa: number;
}

/** Corredores directos. Cada uno se expande a ida y vuelta. */
const corredores: Def[] = [
  // --- Eje troncal Manizales–Pereira–Armenia (autopista del Café) ---
  { de: 'manizales', a: 'chinchina', min: 45, km: 24, tarifa: 8000 },
  { de: 'chinchina', a: 'pereira', min: 60, km: 35, tarifa: 11000 },
  { de: 'pereira', a: 'dosquebradas', min: 20, km: 7, tarifa: 4000 },
  { de: 'pereira', a: 'armenia', min: 60, km: 46, tarifa: 14000 },
  { de: 'pereira', a: 'santa-rosa-de-cabal', min: 40, km: 23, tarifa: 7000 },
  { de: 'manizales', a: 'pereira', min: 90, km: 52, tarifa: 16000 },
  { de: 'manizales', a: 'villamaria', min: 20, km: 7, tarifa: 4000 },
  { de: 'manizales', a: 'neira', min: 40, km: 22, tarifa: 7000 },
  { de: 'chinchina', a: 'palestina', min: 30, km: 14, tarifa: 5000 },
  { de: 'palestina', a: 'manizales', min: 45, km: 25, tarifa: 7000 },

  // --- Quindío (hub Armenia) ---
  { de: 'armenia', a: 'calarca', min: 20, km: 9, tarifa: 4500 },
  { de: 'armenia', a: 'montenegro', min: 25, km: 12, tarifa: 5000 },
  { de: 'armenia', a: 'la-tebaida', min: 25, km: 14, tarifa: 5000 },
  { de: 'armenia', a: 'circasia', min: 25, km: 12, tarifa: 5000 },
  { de: 'armenia', a: 'quimbaya', min: 35, km: 22, tarifa: 6500 },
  { de: 'circasia', a: 'filandia', min: 25, km: 14, tarifa: 5000 },
  { de: 'circasia', a: 'salento', min: 30, km: 17, tarifa: 6000 },
  { de: 'armenia', a: 'salento', min: 45, km: 24, tarifa: 7500 },
  { de: 'montenegro', a: 'quimbaya', min: 20, km: 10, tarifa: 4500 },
  { de: 'calarca', a: 'cordoba', min: 35, km: 20, tarifa: 6000 },
  { de: 'cordoba', a: 'pijao', min: 30, km: 16, tarifa: 5500 },
  { de: 'pijao', a: 'buenavista', min: 30, km: 15, tarifa: 5500 },
  { de: 'calarca', a: 'buenavista', min: 40, km: 24, tarifa: 6500 },
  { de: 'calarca', a: 'genova', min: 90, km: 55, tarifa: 12000 },

  // --- Risaralda (hub Pereira) ---
  { de: 'pereira', a: 'la-virginia', min: 40, km: 28, tarifa: 7000 },
  { de: 'pereira', a: 'marsella', min: 50, km: 30, tarifa: 8000 },
  { de: 'la-virginia', a: 'balboa', min: 30, km: 18, tarifa: 6000 },
  { de: 'balboa', a: 'la-celia', min: 35, km: 20, tarifa: 6500 },
  { de: 'la-virginia', a: 'santuario', min: 60, km: 42, tarifa: 9000 },
  { de: 'santuario', a: 'apia', min: 40, km: 25, tarifa: 7000 },
  { de: 'apia', a: 'pueblo-rico', min: 45, km: 28, tarifa: 7500 },
  { de: 'apia', a: 'belen-de-umbria', min: 50, km: 32, tarifa: 8000 },
  { de: 'belen-de-umbria', a: 'mistrato', min: 45, km: 26, tarifa: 7000 },
  { de: 'belen-de-umbria', a: 'guatica', min: 40, km: 24, tarifa: 6500 },
  { de: 'guatica', a: 'quinchia', min: 35, km: 20, tarifa: 6000 },
  { de: 'pereira', a: 'belen-de-umbria', min: 90, km: 60, tarifa: 12000 },

  // --- Occidente de Caldas (corredor Anserma–Riosucio–Supía) ---
  { de: 'manizales', a: 'anserma', min: 90, km: 62, tarifa: 13000 },
  { de: 'anserma', a: 'risaralda', min: 30, km: 16, tarifa: 5500 },
  { de: 'risaralda', a: 'viterbo', min: 30, km: 18, tarifa: 5500 },
  { de: 'viterbo', a: 'belalcazar', min: 40, km: 24, tarifa: 6500 },
  { de: 'belalcazar', a: 'san-jose', min: 30, km: 16, tarifa: 5500 },
  { de: 'anserma', a: 'riosucio', min: 45, km: 28, tarifa: 7000 },
  { de: 'riosucio', a: 'supia', min: 30, km: 18, tarifa: 5500 },
  { de: 'supia', a: 'marmato', min: 25, km: 12, tarifa: 5000 },
  { de: 'supia', a: 'la-merced', min: 40, km: 24, tarifa: 6500 },
  { de: 'la-merced', a: 'filadelfia', min: 30, km: 18, tarifa: 5500 },
  { de: 'filadelfia', a: 'neira', min: 45, km: 28, tarifa: 7000 },
  { de: 'quinchia', a: 'riosucio', min: 40, km: 24, tarifa: 6500 },

  // --- Norte de Caldas (corredor Salamina–Aguadas–Pácora) ---
  { de: 'neira', a: 'aranzazu', min: 40, km: 24, tarifa: 6500 },
  { de: 'aranzazu', a: 'salamina', min: 45, km: 28, tarifa: 7000 },
  { de: 'salamina', a: 'pacora', min: 40, km: 24, tarifa: 6500 },
  { de: 'pacora', a: 'aguadas', min: 40, km: 23, tarifa: 6500 },
  { de: 'salamina', a: 'marulanda', min: 90, km: 45, tarifa: 11000 },

  // --- Oriente de Caldas (corredor Manzanares–Pensilvania y Magdalena) ---
  { de: 'manizales', a: 'manzanares', min: 150, km: 95, tarifa: 20000 },
  { de: 'manzanares', a: 'marquetalia', min: 40, km: 22, tarifa: 6500 },
  { de: 'manzanares', a: 'pensilvania', min: 60, km: 35, tarifa: 9000 },
  { de: 'marquetalia', a: 'victoria', min: 60, km: 38, tarifa: 9000 },
  { de: 'victoria', a: 'la-dorada', min: 70, km: 45, tarifa: 10000 },
  { de: 'manzanares', a: 'samana', min: 120, km: 70, tarifa: 16000 },
  { de: 'samana', a: 'norcasia', min: 60, km: 35, tarifa: 9000 },
  { de: 'norcasia', a: 'la-dorada', min: 90, km: 58, tarifa: 12000 },
  { de: 'manizales', a: 'la-dorada', min: 210, km: 165, tarifa: 32000 },

  // --- Conexión Risaralda occidente con Chocó (Pueblo Rico es el fin) ---
  // (ya conectado por Apía)

  // --- Orígenes externos ---
  { de: 'bogota', a: 'manizales', min: 480, km: 290, tarifa: 75000 },
  { de: 'bogota', a: 'pereira', min: 540, km: 330, tarifa: 80000 },
  { de: 'bogota', a: 'armenia', min: 480, km: 290, tarifa: 75000 },
  { de: 'bogota', a: 'la-dorada', min: 300, km: 180, tarifa: 55000 },
  { de: 'medellin', a: 'manizales', min: 300, km: 190, tarifa: 60000 },
  { de: 'medellin', a: 'pereira', min: 330, km: 215, tarifa: 65000 },
  { de: 'medellin', a: 'riosucio', min: 240, km: 150, tarifa: 50000 },
  { de: 'cali', a: 'armenia', min: 210, km: 190, tarifa: 50000 },
  { de: 'cali', a: 'pereira', min: 240, km: 215, tarifa: 55000 },
];

function expandir(defs: Def[]): RutaBusSeed[] {
  const rutas: RutaBusSeed[] = [];
  for (const c of defs) {
    const base = {
      minutos: c.min,
      distancia_km: c.km,
      tarifa_cop: c.tarifa,
      costo_aproximado: true,
      fecha_actualizacion: REV,
      fuente: FUENTE,
    };
    rutas.push({ nodo_origen: c.de, nodo_destino: c.a, ...base });
    rutas.push({ nodo_origen: c.a, nodo_destino: c.de, ...base });
  }
  return rutas;
}

export const rutasBus: RutaBusSeed[] = expandir(corredores);
