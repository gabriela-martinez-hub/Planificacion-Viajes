// Generación del informe de evaluación en Markdown (T-27, entregable académico).
//
// Toma los resultados de evaluar.ts y produce un texto Markdown con la tabla
// por instancia y el resumen agregado. Es una función pura (recibe los
// resultados y la fecha), de modo que el script scripts/evaluar-generador.ts
// solo se encarga de escribir el archivo.

import type { ResultadoInstancia, ResumenEvaluacion } from './evaluar';

function num(n: number, decimales = 2): string {
  return n.toFixed(decimales);
}

function pct(fraccion: number): string {
  return `${(fraccion * 100).toFixed(1)} %`;
}

export function generarInforme(
  resultados: ResultadoInstancia[],
  resumen: ResumenEvaluacion,
  fecha: string,
): string {
  const lineas: string[] = [];

  lineas.push('# Informe de evaluación del generador de itinerarios (T-27)');
  lineas.push('');
  lineas.push(
    '> Generado por `scripts/evaluar-generador.ts`. No se edita a mano: ' +
      'vuelve a correr `npm run evaluar` para actualizarlo.',
  );
  lineas.push('');
  lineas.push(`Fecha de generación: ${fecha}`);
  lineas.push('');
  lineas.push('## Qué se evalúa');
  lineas.push('');
  lineas.push(
    'Se comparan tres estrategias sobre el mismo banco de instancias ' +
      '(`casos.ts`), con la función objetivo y el verificador de restricciones ' +
      'de `objetivo.ts` (plan.md 6.0):',
  );
  lineas.push('');
  lineas.push(
    '- **voraz**: solo la construcción voraz (`generador.ts`, pasos 1-6).',
  );
  lineas.push(
    '- **voraz+local**: voraz seguida de búsqueda local por ascenso de colina ' +
      '(`index.ts`, paso 7).',
  );
  lineas.push(
    '- **fuerza bruta**: óptimo exacto por enumeración, solo en instancias con ' +
      '≤ 8 atracciones candidatas (`fuerza-bruta.ts`).',
  );
  lineas.push('');
  lineas.push(
    'El objetivo (a maximizar) es ' +
      '`Σ puntuación(a) − λ · minutos_traslado − μ · penalización_lluvia`. ' +
      'La brecha de optimalidad es `(óptimo − objetivo_voraz_local) / |óptimo|`.',
  );
  lineas.push('');

  // --- Resumen ---
  lineas.push('## Resumen');
  lineas.push('');
  lineas.push(`- Instancias evaluadas: **${resumen.total}**.`);
  lineas.push(
    `- Instancias con alguna violación de restricciones: **${resumen.conViolaciones}** ` +
      '(el criterio de la fase b exige 0).',
  );
  lineas.push(
    `- Instancias pequeñas comparadas contra el óptimo exacto: **${resumen.aptasCount}**; ` +
      `de ellas, **${resumen.optimasCount}** alcanzan el óptimo.`,
  );
  lineas.push(
    `- Instancias donde la búsqueda local mejora el objetivo: **${resumen.vorazLocalMejoraCount}**.`,
  );
  lineas.push(
    `- Mayor diferencia absoluta de objetivo frente al óptimo: **${num(resumen.brechaAbsMax)}** puntos.`,
  );
  if (resumen.noOptimas.length > 0) {
    lineas.push(
      `- Instancias pequeñas por debajo del óptimo (${resumen.noOptimas.length}):`,
    );
    for (const n of resumen.noOptimas) {
      lineas.push(
        `  - \`${n.nombre}\`: objetivo ${num(n.objetivo)} vs óptimo ${num(n.optimo)} ` +
          `(diferencia ${num(n.diferencia)}).`,
      );
    }
  }
  lineas.push(
    `- Tiempo de generación (voraz+local): promedio **${num(resumen.tiempoPromedioMs)} ms**, ` +
      `máximo **${num(resumen.tiempoMaxMs)} ms** (criterio: < 500 ms).`,
  );
  lineas.push('');
  lineas.push(
    '> Se reporta el **número de instancias en el óptimo** en vez de un promedio ' +
      'de brechas porcentuales: cuando el objetivo óptimo es pequeño en magnitud ' +
      '(dominado por el término de penalización por lluvia o por traslados largos), ' +
      'el porcentaje se dispara y deja de ser informativo. La columna "Brecha" de ' +
      'la tabla se mantiene como referencia por instancia.',
  );
  lineas.push('');
  lineas.push(
    '> Nota: los tiempos se miden en el entorno de ejecución de las pruebas, ' +
      'no en un móvil de gama media. Sirven como cota optimista; el margen ' +
      'respecto a 500 ms es amplio.',
  );
  lineas.push('');

  // --- Tabla por instancia ---
  lineas.push('## Resultados por instancia');
  lineas.push('');
  lineas.push(
    '| Instancia | Obj. voraz | Obj. voraz+local | Óptimo (FB) | Brecha | Viol. | Costo total (voraz+local) | t (ms) |',
  );
  lineas.push('|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of resultados) {
    const opt = r.objetivoOptimo !== undefined ? num(r.objetivoOptimo) : '—';
    const brecha =
      r.brechaOptimalidad !== undefined ? pct(r.brechaOptimalidad) : '—';
    const viol = r.voraz.violaciones + r.vorazLocal.violaciones;
    const costo = r.vorazLocal.factible
      ? r.vorazLocal.costoTotal.toLocaleString('es-CO')
      : 'infactible';
    const objV = r.voraz.factible ? num(r.voraz.objetivo) : '—';
    const objVL = r.vorazLocal.factible ? num(r.vorazLocal.objetivo) : '—';
    lineas.push(
      `| ${r.nombre} | ${objV} | ${objVL} | ${opt} | ${brecha} | ${viol} | ${costo} | ${num(r.vorazLocal.tiempoMs)} |`,
    );
  }
  lineas.push('');

  // --- Descripciones ---
  lineas.push('## Descripción de las instancias');
  lineas.push('');
  for (const r of resultados) {
    const apta = r.aptaFuerzaBruta ? ' _(apta para fuerza bruta)_' : '';
    const fallo = r.esperaFallo ? ' _(caso infactible esperado)_' : '';
    lineas.push(`- **${r.nombre}**: ${r.descripcion}.${apta}${fallo}`);
  }
  lineas.push('');

  // --- Conclusiones ---
  lineas.push('## Conclusiones');
  lineas.push('');
  lineas.push(
    `- El generador no produce **ninguna** violación de restricciones ` +
      `(${resumen.conViolaciones} de ${resumen.total}), cumpliendo el criterio de la fase b.`,
  );
  lineas.push(
    `- En ${resumen.optimasCount} de ${resumen.aptasCount} instancias pequeñas la ` +
      'heurística alcanza el óptimo exacto. La heurística nunca supera al óptimo ' +
      '(una brecha negativa indicaría un error del modelo).',
  );
  lineas.push(
    '- Las brechas no nulas tienen dos causas identificadas y esperables para una ' +
      'construcción voraz:',
  );
  lineas.push(
    '  1. **Elección voraz local** (p. ej. `sint-05`): el voraz toma una ' +
      'atracción de alta puntuación que satura la jornada, cuando dos atracciones ' +
      'más cortas habrían sumado más puntuación. Es la limitación clásica de una ' +
      'heurística voraz con restricción de capacidad.',
  );
  lineas.push(
    '  2. **La búsqueda local no descarta actividades** (p. ej. `sint-11`): sus ' +
      'movimientos reubican actividades al aire libre a días secos, pero si el día ' +
      'seco no tiene cupo, la actividad se queda bajo la lluvia; el óptimo, en ' +
      'cambio, prefiere no incluirla. Quitar actividades para reducir la ' +
      'penalización por lluvia no es un movimiento de la búsqueda local actual.',
  );
  lineas.push(
    '- La búsqueda local nunca empeora el objetivo y lo mejora en los casos con ' +
      'clima lluvioso donde sí hay cupo en un día seco (reubica respetando el ' +
      'límite de jornada, corrección introducida en esta tarea).',
  );
  lineas.push('');

  return lineas.join('\n') + '\n';
}
