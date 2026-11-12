// Tipos del dominio geo (plan.md 6.4).
//
// El dominio geo es puro: calcula distancias y decide si un check-in se
// verificaría, sin leer la red ni la geolocalización del sistema. Es el REFLEJO
// en el cliente de la regla que aplica el servidor en la RPC registrar_checkin;
// sirve para mostrar una vista previa antes de enviar. La verificación que
// otorga valor la decide siempre el servidor (plan.md, arquitectura sección 4).

/** Punto geográfico en grados decimales. */
export interface Punto {
  lat: number;
  lon: number;
}

/** Resultado de evaluar si un check-in se verificaría. */
export interface ResultadoVerificacion {
  /** Distancia en metros entre el usuario y el lugar. */
  distanciaM: number;
  /** true si distancia + precisión <= radio (plan.md 6.4). */
  verificado: boolean;
}
