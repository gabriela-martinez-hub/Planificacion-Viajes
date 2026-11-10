// Orígenes externos: ciudades principales desde las que puede partir el viaje
// (plan.md 1.2, supuesto 1). Coordenadas de la terminal de transporte / centro.
import type { OrigenExterno } from '../../../src/domain/catalogo/esquemas';

export const origenesExternos: OrigenExterno[] = [
  { id: 'bogota', nombre: 'Bogotá', lat: 4.60971, lon: -74.08175 },
  { id: 'medellin', nombre: 'Medellín', lat: 6.25184, lon: -75.56359 },
  { id: 'cali', nombre: 'Cali', lat: 3.43722, lon: -76.5225 },
];
