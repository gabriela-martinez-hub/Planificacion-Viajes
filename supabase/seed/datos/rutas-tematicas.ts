// Rutas temáticas y sus ítems (plan.md 5.1, 7). Decisiones en FUENTES.md:
//  - Pueblos patrimonio: Salamina y Aguadas (Red Turística de Pueblos
//    Patrimonio; únicos de los tres departamentos). Se referencian como
//    municipios.
//  - Ruta del café: no hay lista oficial; se arma con atracciones cafeteras
//    del seed (decisión del usuario 2026-11-09).
//  - Ruta de termales: no hay lista oficial; se arma con las atracciones
//    termales del seed (decisión del usuario 2026-11-09).
//
// clave_texto apunta a src/i18n/es-CO.ts (rutas.*).
import type {
  RutaTematica,
  RutaItem,
} from '../../../src/domain/catalogo/esquemas';

export const rutasTematicas: RutaTematica[] = [
  {
    id: 'pueblos-patrimonio',
    clave_texto: 'rutas.pueblosPatrimonio',
    fuente:
      'Red Turística de Pueblos Patrimonio (MinCIT/FONTUR), ver FUENTES.md',
  },
  {
    id: 'cafe',
    clave_texto: 'rutas.cafe',
    fuente: 'Armada con atracciones cafeteras del seed (ver FUENTES.md)',
  },
  {
    id: 'termales',
    clave_texto: 'rutas.termales',
    fuente: 'Armada con atracciones termales del seed (ver FUENTES.md)',
  },
];

export const rutaItems: RutaItem[] = [
  // Pueblos patrimonio: municipios.
  { ruta_id: 'pueblos-patrimonio', municipio_id: 'salamina' },
  { ruta_id: 'pueblos-patrimonio', municipio_id: 'aguadas' },

  // Ruta del café: atracciones de cultura cafetera del seed.
  { ruta_id: 'cafe', atraccion_id: 'parque-del-cafe' },
  { ruta_id: 'cafe', atraccion_id: 'recinto-del-pensamiento' },
  { ruta_id: 'cafe', atraccion_id: 'calle-real-filandia' },
  { ruta_id: 'cafe', atraccion_id: 'calle-real-salento' },

  // Ruta de termales: atracciones termales del seed.
  { ruta_id: 'termales', atraccion_id: 'termales-santa-rosa' },
  { ruta_id: 'termales', atraccion_id: 'termales-san-vicente' },
];
