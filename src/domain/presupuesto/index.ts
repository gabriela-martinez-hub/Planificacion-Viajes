// Presupuesto del viaje (plan.md 6.1 paso 8 y 6.2). Dominio puro.
//
// El modo "viaje soñado" (meta de ahorro y aportes) es T-16 y se apoyará en
// estos cálculos.

export * from './tipos';
export { desglosar } from './desglose';
export { ajustarAPresupuesto } from './ajustar';
export {
  calcularAhorro,
  totalAportado,
  type Aporte,
  type EntradaAhorro,
  type EstadoMeta,
  type FrecuenciaAhorro,
  type ResultadoAhorro,
} from './ahorro';
