// Carga el catálogo del seed en Supabase (T-08, plan.md 5.3, 7).
//
// Usa la clave service_role (SUPABASE_SERVICE_ROLE_KEY, sin prefijo VITE_), que
// salta RLS para poder escribir el catálogo de solo lectura. Esa clave nunca
// entra al bundle del cliente.
//
// Flujo:
//   1. Construye y valida el seed con Zod (construirSeed). Si algo no cumple el
//      esquema, aborta antes de tocar la base.
//   2. Valida la integridad referencial y la conectividad del grafo de buses.
//   3. Carga las tablas en orden de dependencias con upsert (idempotente: se
//      puede volver a ejecutar sin duplicar).
//
// Uso:
//   npx tsx scripts/cargar-seed.ts            (carga)
//   npx tsx scripts/cargar-seed.ts --dry-run  (solo valida, no escribe)
//
// Requiere variables de entorno (de .env, no versionado):
//   VITE_SUPABASE_URL           URL del proyecto
//   SUPABASE_SERVICE_ROLE_KEY   clave secreta service_role

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { construirSeed } from '../supabase/seed/datos/index';
import {
  validarReferencias,
  analizarConectividadBus,
} from '../src/domain/catalogo/validar';
import type { Catalogo } from '../src/domain/catalogo/esquemas';

function abortar(mensaje: string): never {
  console.error(`\n✗ ${mensaje}`);
  process.exit(1);
}

/**
 * Carga el archivo .env de la raíz del proyecto en process.env, sin depender de
 * ninguna librería. Solo define variables que aún no existan en el entorno (las
 * del entorno real ganan). Si no hay .env, no hace nada: puede que las variables
 * ya vengan del entorno (por ejemplo, en CI).
 */
function cargarDotenv(): void {
  const aqui = dirname(fileURLToPath(import.meta.url));
  const rutaEnv = resolve(aqui, '..', '.env');
  let contenido: string;
  try {
    contenido = readFileSync(rutaEnv, 'utf8');
  } catch {
    return; // no hay .env; se usan las variables del entorno si existen
  }
  for (const lineaCruda of contenido.split('\n')) {
    const linea = lineaCruda.trim();
    if (linea === '' || linea.startsWith('#')) continue;
    const igual = linea.indexOf('=');
    if (igual === -1) continue;
    const clave = linea.slice(0, igual).trim();
    let valor = linea.slice(igual + 1).trim();
    // Quita comillas envolventes si las hay.
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    if (clave && process.env[clave] === undefined) {
      process.env[clave] = valor;
    }
  }
}

function leerEntorno(): { url: string; serviceRoleKey: string } {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const faltan = [
    ['VITE_SUPABASE_URL', url],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (faltan.length > 0) {
    abortar(
      `Faltan variables de entorno: ${faltan.join(', ')}. ` +
        'Revisa que el archivo .env de la raíz las tenga con valor ' +
        '(usa .env.example como plantilla).',
    );
  }
  return { url: url as string, serviceRoleKey: serviceRoleKey as string };
}

/** Inserta un lote con upsert y aborta con detalle si Supabase devuelve error. */
async function cargar<T extends object>(
  supabase: SupabaseClient,
  tabla: string,
  filas: T[],
  onConflict: string,
): Promise<void> {
  if (filas.length === 0) {
    console.log(`  ${tabla}: 0 filas (se omite)`);
    return;
  }
  const { error } = await supabase
    .from(tabla)
    .upsert(filas as never, { onConflict });
  if (error) {
    abortar(`Error al cargar ${tabla}: ${error.message}`);
  }
  console.log(`  ${tabla}: ${filas.length} filas`);
}

/** Valida el seed (Zod ya corrió en construirSeed): referencias y grafo. */
function validar(cat: Catalogo): void {
  const problemas = validarReferencias(cat);
  if (problemas.length > 0) {
    console.error('\n✗ Problemas de integridad referencial:');
    for (const p of problemas) {
      console.error(`  [${p.tabla}] ${p.id}: ${p.problema}`);
    }
    abortar(`${problemas.length} problema(s) de integridad; no se carga nada.`);
  }

  const conectividad = analizarConectividadBus(cat);
  console.log(
    `  Grafo de buses: ${conectividad.alcanzables.length} municipios conectados, ` +
      `${conectividad.aislados.length} aislados`,
  );
  if (!conectividad.todosConectados) {
    console.warn(
      `  ⚠ Municipios aislados (sin ruta de bus): ${conectividad.aislados.join(', ')}`,
    );
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  console.log('Construyendo y validando el seed…');
  const cat = construirSeed(); // valida con Zod; lanza si algo no cumple
  console.log(
    `  ${cat.departamentos.length} departamentos, ${cat.municipios.length} municipios, ` +
      `${cat.atracciones.length} atracciones, ${cat.rutas_bus.length} rutas de bus`,
  );
  validar(cat);

  if (dryRun) {
    console.log(
      '\n✓ Validación correcta (dry-run, no se escribió en la base).',
    );
    return;
  }

  cargarDotenv();
  const { url, serviceRoleKey } = leerEntorno();
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('\nCargando en Supabase (upsert, idempotente)…');

  // Nodos primero: municipios y orígenes externos dependen de nodos(id, tipo).
  const nodos = [
    ...cat.municipios.map((m) => ({
      id: m.id,
      tipo: 'municipio' as const,
      nombre: m.nombre,
      lat: m.lat,
      lon: m.lon,
    })),
    ...cat.origenes_externos.map((e) => ({
      id: e.id,
      tipo: 'externo' as const,
      nombre: e.nombre,
      lat: e.lat,
      lon: e.lon,
    })),
  ];

  await cargar(supabase, 'departamentos', cat.departamentos, 'id');
  await cargar(supabase, 'nodos', nodos, 'id');

  // municipios y origenes_externos: solo las columnas de esas tablas (el
  // nombre y coordenadas ya viven en nodos).
  await cargar(
    supabase,
    'municipios',
    cat.municipios.map((m) => ({
      id: m.id,
      departamento_id: m.departamento_id,
      codigo_dane: m.codigo_dane,
      altitud_m: m.altitud_m,
      es_pueblo_patrimonio: m.es_pueblo_patrimonio,
      radio_checkin_m: m.radio_checkin_m,
    })),
    'id',
  );
  await cargar(
    supabase,
    'origenes_externos',
    cat.origenes_externos.map((e) => ({ id: e.id })),
    'id',
  );

  await cargar(supabase, 'atracciones', cat.atracciones, 'id');
  await cargar(
    supabase,
    'rutas_bus',
    cat.rutas_bus,
    'nodo_origen,nodo_destino',
  );
  await cargar(
    supabase,
    'tarifas_referencia',
    cat.tarifas_referencia,
    'concepto,nivel,municipio_id',
  );
  if (cat.clima_mensual.length > 0) {
    await cargar(
      supabase,
      'clima_mensual',
      cat.clima_mensual,
      'municipio_id,mes',
    );
  } else {
    console.log('  clima_mensual: 0 filas (lo genera T-25)');
  }
  await cargar(supabase, 'rutas_tematicas', cat.rutas_tematicas, 'id');

  // ruta_items no tiene id natural estable para upsert; se reemplaza por ruta.
  for (const ruta of cat.rutas_tematicas) {
    const { error } = await supabase
      .from('ruta_items')
      .delete()
      .eq('ruta_id', ruta.id);
    if (error)
      abortar(`Error limpiando ruta_items de ${ruta.id}: ${error.message}`);
  }
  if (cat.ruta_items.length > 0) {
    const { error } = await supabase
      .from('ruta_items')
      .insert(cat.ruta_items as never);
    if (error) abortar(`Error al cargar ruta_items: ${error.message}`);
    console.log(`  ruta_items: ${cat.ruta_items.length} filas`);
  }

  await cargar(supabase, 'insignias', cat.insignias, 'id');

  console.log('\n✓ Seed cargado.');
}

main().catch((e: unknown) => {
  abortar(e instanceof Error ? e.message : String(e));
});
