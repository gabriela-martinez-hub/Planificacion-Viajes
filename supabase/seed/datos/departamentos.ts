// Los tres departamentos del MVP. Códigos DANE (DIVIPOLA, ver FUENTES.md).
import type { Departamento } from '../../../src/domain/catalogo/esquemas';

export const departamentos: Departamento[] = [
  { id: 'caldas', nombre: 'Caldas', codigo_dane: '17' },
  { id: 'quindio', nombre: 'Quindío', codigo_dane: '63' },
  { id: 'risaralda', nombre: 'Risaralda', codigo_dane: '66' },
];
