// Pruebas del dominio geo (T-19, plan.md 6.4).
//
// Cubren la fórmula haversine y la regla de verificación `distancia + precision
// <= radio`, con los casos límite de radio y precisión que pide el criterio de
// aceptación de la fase (e). Son el reflejo de la regla del servidor, así que
// estas pruebas también documentan el comportamiento esperado de la RPC.

import { describe, it, expect } from 'vitest';
import { distanciaHaversineM, verificarCheckin } from './distancia';
import type { Punto } from './tipos';

// Armenia (casco), punto de referencia para las pruebas.
const ARMENIA: Punto = { lat: 4.5339, lon: -75.6811 };

describe('distanciaHaversineM', () => {
  it('es 0 entre un punto y sí mismo', () => {
    expect(distanciaHaversineM(ARMENIA, ARMENIA)).toBe(0);
  });

  it('es simétrica', () => {
    const b: Punto = { lat: 4.6381, lon: -75.6716 }; // cerca de Salento
    expect(distanciaHaversineM(ARMENIA, b)).toBeCloseTo(
      distanciaHaversineM(b, ARMENIA),
      6,
    );
  });

  it('aproxima un grado de latitud a ~111 km', () => {
    const norte: Punto = { lat: ARMENIA.lat + 1, lon: ARMENIA.lon };
    const d = distanciaHaversineM(ARMENIA, norte);
    // Un grado de latitud ≈ 111.19 km. Toleramos 1 km.
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it('calcula una distancia conocida con baja tolerancia', () => {
    // 0.01° de longitud en el ecuador ≈ 1113.2 m; a 4.53° de latitud se acorta
    // por cos(lat): ≈ 1108.5 m (valor haversine exacto).
    const este: Punto = { lat: ARMENIA.lat, lon: ARMENIA.lon + 0.01 };
    expect(distanciaHaversineM(ARMENIA, este)).toBeCloseTo(1108.5, 0);
  });
});

describe('verificarCheckin — regla distancia + precisión <= radio', () => {
  it('verifica cuando se está en el punto con buena precisión', () => {
    const r = verificarCheckin(ARMENIA, ARMENIA, 300, 10);
    expect(r.distanciaM).toBe(0);
    expect(r.verificado).toBe(true);
  });

  it('NO verifica si la precisión es peor que el radio, aun en el punto', () => {
    // distancia 0 pero precisión 400 > radio 300 (plan.md 6.4).
    const r = verificarCheckin(ARMENIA, ARMENIA, 300, 400);
    expect(r.verificado).toBe(false);
  });

  it('acepta justo en el límite: distancia + precisión = radio', () => {
    // Punto a ~100 m al este y precisión 200, radio 300 -> 100 + 200 = 300.
    const lugar = ARMENIA;
    // Buscamos un desplazamiento que dé ~100 m. 0.0009° lon ≈ 99.9 m aquí.
    const usuario: Punto = { lat: ARMENIA.lat, lon: ARMENIA.lon + 0.0009 };
    const d = distanciaHaversineM(usuario, lugar);
    const radio = Math.round(d) + 200;
    const r = verificarCheckin(usuario, lugar, radio, 200);
    // d + 200 <= round(d) + 200 se cumple salvo redondeo; comprobamos el borde.
    expect(d + 200).toBeLessThanOrEqual(radio + 0.5);
    expect(r.verificado).toBe(true);
  });

  it('NO verifica un metro por fuera del límite', () => {
    const usuario: Punto = { lat: ARMENIA.lat, lon: ARMENIA.lon + 0.01 }; // ~1110 m
    const d = distanciaHaversineM(usuario, ARMENIA);
    // radio justo por debajo de distancia + precisión.
    const radio = Math.floor(d + 50) - 1;
    const r = verificarCheckin(usuario, ARMENIA, radio, 50);
    expect(r.verificado).toBe(false);
  });

  it('con precisión 0 verifica si la distancia no supera el radio', () => {
    const usuario: Punto = { lat: ARMENIA.lat, lon: ARMENIA.lon + 0.001 }; // ~111 m
    const r = verificarCheckin(usuario, ARMENIA, 300, 0);
    expect(r.verificado).toBe(true);
  });

  it('rechaza precisión negativa o no finita', () => {
    expect(verificarCheckin(ARMENIA, ARMENIA, 300, -1).verificado).toBe(false);
    expect(verificarCheckin(ARMENIA, ARMENIA, 300, NaN).verificado).toBe(false);
    expect(verificarCheckin(ARMENIA, ARMENIA, 300, Infinity).verificado).toBe(
      false,
    );
  });

  it('un radio grande (atracción extensa) verifica a cientos de metros', () => {
    // Valle de Cocora usa radio de 1-2 km (plan.md 6.4).
    const usuario: Punto = { lat: ARMENIA.lat, lon: ARMENIA.lon + 0.005 }; // ~555 m
    const r = verificarCheckin(usuario, ARMENIA, 2000, 50);
    expect(r.verificado).toBe(true);
  });
});
