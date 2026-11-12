// Pruebas de la evaluación del generador (T-27, plan.md 6.0).
//
// Verifican el criterio de aceptación de la fase (b) que faltaba por evidencia:
// "0 violaciones de restricciones en las instancias de prueba". Además
// comprueban que la búsqueda local nunca empeora el objetivo frente al voraz y
// que, en las instancias pequeñas, la heurística no supera al óptimo por fuerza
// bruta (una brecha negativa indicaría un error en el modelo).

import { describe, it, expect } from 'vitest';
import { INSTANCIAS } from './casos';
import { evaluarTodas, resumir, type ResultadoInstancia } from './evaluar';
import { optimoFuerzaBruta } from './fuerza-bruta';
import { generarItinerario } from './../index';
import { verificarRestricciones } from './objetivo';

// Se evalúa una sola vez y se reutiliza (determinista).
const resultados: ResultadoInstancia[] = evaluarTodas();
const resumen = resumir(resultados);

describe('banco de instancias (T-27)', () => {
  it('tiene entre 20 y 30 instancias versionadas', () => {
    expect(INSTANCIAS.length).toBeGreaterThanOrEqual(20);
    expect(INSTANCIAS.length).toBeLessThanOrEqual(30);
  });

  it('incluye al menos una instancia apta para fuerza bruta', () => {
    expect(INSTANCIAS.some((i) => i.aptaFuerzaBruta)).toBe(true);
  });
});

describe('restricciones duras (criterio F-b: 0 violaciones)', () => {
  it('ninguna estrategia viola restricciones en ninguna instancia', () => {
    for (const r of resultados) {
      expect(
        r.voraz.violaciones,
        `voraz violó restricciones en ${r.nombre}`,
      ).toBe(0);
      expect(
        r.vorazLocal.violaciones,
        `voraz+local violó restricciones en ${r.nombre}`,
      ).toBe(0);
    }
    expect(resumen.conViolaciones).toBe(0);
  });

  it('el verificador detecta un itinerario fabricado inválido (prueba del verificador)', () => {
    // Nos aseguramos de que verificarRestricciones no sea un "siempre 0".
    const instancia = INSTANCIAS.find((i) => !i.esperaFallo)!;
    const r = generarItinerario(instancia.entrada);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Fabricamos una violación: duplicamos la primera actividad en su día.
    const copia = structuredClone(r.itinerario);
    const dia = copia.dias.find((d) =>
      d.items.some((it) => it.tipo === 'actividad'),
    );
    if (dia) {
      const act = dia.items.find((it) => it.tipo === 'actividad')!;
      dia.items.push({ ...act, orden: dia.items.length + 1 });
      const violaciones = verificarRestricciones(copia, instancia.entrada);
      expect(violaciones.some((v) => v.tipo === 'atraccion_repetida')).toBe(
        true,
      );
    }
  });
});

describe('voraz vs. voraz + búsqueda local', () => {
  it('la búsqueda local nunca empeora el objetivo', () => {
    for (const r of resultados) {
      expect(
        r.localNoEmpeora,
        `${r.nombre}: voraz=${r.voraz.objetivo} local=${r.vorazLocal.objetivo}`,
      ).toBe(true);
    }
  });
});

describe('brecha de optimalidad (instancias pequeñas)', () => {
  it('la heurística nunca supera al óptimo por fuerza bruta (brecha >= 0)', () => {
    const aptas = resultados.filter(
      (r) => r.brechaOptimalidad !== undefined && !r.esperaFallo,
    );
    expect(aptas.length).toBeGreaterThan(0);
    for (const r of aptas) {
      // Brecha >= 0 (con una pequeña tolerancia numérica): el óptimo es cota
      // superior. Una brecha negativa sería un error del modelo.
      expect(
        r.brechaOptimalidad!,
        `${r.nombre}: brecha ${r.brechaOptimalidad}`,
      ).toBeGreaterThanOrEqual(-1e-9);
    }
  });

  it('la fuerza bruta evalúa al menos una asignación en las instancias aptas', () => {
    const aptas = INSTANCIAS.filter((i) => i.aptaFuerzaBruta && !i.esperaFallo);
    for (const i of aptas) {
      const { evaluadas } = optimoFuerzaBruta(i.entrada);
      expect(evaluadas, i.nombre).toBeGreaterThan(0);
    }
  });
});

describe('casos infactibles', () => {
  it('los casos marcados esperaFallo no son factibles', () => {
    for (const r of resultados.filter((x) => x.esperaFallo)) {
      expect(r.voraz.factible, r.nombre).toBe(false);
      expect(r.vorazLocal.factible, r.nombre).toBe(false);
    }
  });
});

describe('rendimiento', () => {
  it('cada generación individual está holgadamente por debajo de 500 ms', () => {
    // Criterio F-b: generación < 500 ms en un móvil de gama media. En este
    // entorno medimos tiempos muy inferiores; dejamos un margen generoso.
    for (const r of resultados) {
      expect(r.vorazLocal.tiempoMs, r.nombre).toBeLessThan(500);
    }
  });
});
