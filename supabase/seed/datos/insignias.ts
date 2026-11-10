// Insignias del catálogo (plan.md 5.1, 6.4). Tipos:
//   - departamento: completar todos los municipios de un departamento.
//   - eje: completar los 53 municipios de los tres departamentos.
//   - ruta: completar los ítems de una ruta temática.
// Las insignias por municipio/atracción individuales las puede añadir el seed
// más adelante; aquí van las de progreso que usan el perfil y el trigger.
//
// clave_texto apunta a src/i18n/es-CO.ts (insignias.*). icono es el nombre de
// un emoji o identificador que la UI resuelve.
import type { Insignia } from '../../../src/domain/catalogo/esquemas';

export const insignias: Insignia[] = [
  // Por departamento.
  {
    id: 'depto-caldas',
    tipo: 'departamento',
    departamento_id: 'caldas',
    clave_texto: 'insignias.caldas',
    icono: '🏔️',
  },
  {
    id: 'depto-quindio',
    tipo: 'departamento',
    departamento_id: 'quindio',
    clave_texto: 'insignias.quindio',
    icono: '🌴',
  },
  {
    id: 'depto-risaralda',
    tipo: 'departamento',
    departamento_id: 'risaralda',
    clave_texto: 'insignias.risaralda',
    icono: '♨️',
  },

  // El reto de largo plazo: los 53 municipios (plan.md 1.2, supuesto 4).
  {
    id: 'eje-cafetero',
    tipo: 'eje',
    clave_texto: 'insignias.ejeCafetero',
    icono: '☕',
  },

  // Por ruta temática.
  {
    id: 'ruta-pueblos-patrimonio',
    tipo: 'ruta',
    ruta_id: 'pueblos-patrimonio',
    clave_texto: 'insignias.rutaPueblosPatrimonio',
    icono: '🏛️',
  },
  {
    id: 'ruta-cafe',
    tipo: 'ruta',
    ruta_id: 'cafe',
    clave_texto: 'insignias.rutaCafe',
    icono: '☕',
  },
  {
    id: 'ruta-termales',
    tipo: 'ruta',
    ruta_id: 'termales',
    clave_texto: 'insignias.rutaTermales',
    icono: '♨️',
  },
];
