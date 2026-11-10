// Tarifas de referencia de alojamiento y comida por nivel (plan.md 5.1, 6.2).
// Son tarifas REGIONALES (municipio_id nulo): se aplican a cualquier municipio
// que no tenga una tarifa propia. Valores por persona.
//   - alojamiento: COP por persona y noche.
//   - comida: COP por persona y día (desayuno + almuerzo + cena).
//
// Nota de alcance (R-04): valores de referencia, costo_aproximado=true. El
// usuario debe revisarlos antes de la sustentación.
import type { TarifaReferenciaSeed } from '../../../src/domain/catalogo/esquemas';

const REV = '2026-11-10';
const FUENTE =
  'Seed académico Eje Cafetero: tarifas de referencia por nivel; verificar antes de usar';

export const tarifasReferencia: TarifaReferenciaSeed[] = [
  // Alojamiento (por persona y noche). Supone habitación compartida en nivel
  // económico, hotel medio y hotel/hacienda en nivel alto.
  {
    concepto: 'alojamiento',
    nivel: 'economico',
    valor_cop: 45000,
    unidad: 'persona_noche',
    costo_aproximado: true,
    fecha_actualizacion: REV,
    fuente: FUENTE,
  },
  {
    concepto: 'alojamiento',
    nivel: 'medio',
    valor_cop: 95000,
    unidad: 'persona_noche',
    costo_aproximado: true,
    fecha_actualizacion: REV,
    fuente: FUENTE,
  },
  {
    concepto: 'alojamiento',
    nivel: 'alto',
    valor_cop: 200000,
    unidad: 'persona_noche',
    costo_aproximado: true,
    fecha_actualizacion: REV,
    fuente: FUENTE,
  },

  // Comida (por persona y día): tres comidas.
  {
    concepto: 'comida',
    nivel: 'economico',
    valor_cop: 35000,
    unidad: 'persona_dia',
    costo_aproximado: true,
    fecha_actualizacion: REV,
    fuente: FUENTE,
  },
  {
    concepto: 'comida',
    nivel: 'medio',
    valor_cop: 65000,
    unidad: 'persona_dia',
    costo_aproximado: true,
    fecha_actualizacion: REV,
    fuente: FUENTE,
  },
  {
    concepto: 'comida',
    nivel: 'alto',
    valor_cop: 120000,
    unidad: 'persona_dia',
    costo_aproximado: true,
    fecha_actualizacion: REV,
    fuente: FUENTE,
  },
];
