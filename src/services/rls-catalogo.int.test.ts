// Prueba de integración del criterio RLS de la fase (a) (T-30, plan.md 5.3):
// "Un INSERT con la clave pública sobre atracciones falla".
//
// A diferencia de los demás tests (lógica pura), este toca la RED REAL: se
// conecta al proyecto Supabase con la clave pública "anon" e intenta escribir
// en el catálogo. Confirma que RLS lo impide.
//
// Por eso:
//   - Lee las credenciales del archivo .env de la raíz por su cuenta (igual que
//     scripts/cargar-seed.ts). No depende del import.meta.env de Vite.
//   - Si no hay credenciales (por ejemplo, en CI, que corre sin .env), la suite
//     se SALTA entera (describe.skip). Así no rompe el pipeline.
//   - Solo hace intentos de ESCRITURA que deben fallar; no deja basura en la
//     base. Un SELECT de control confirma que no se escribió nada.
//
// Cómo correrla en local (con el .env configurado):
//   npm test -- rls-catalogo
//
// Nota técnica: cuando RLS bloquea una escritura, PostgREST puede responder de
// dos formas y AMBAS cuentan como "no se escribió":
//   a) un error explícito (código 42501 / "violates row-level security"), o
//   b) 0 filas afectadas sin error (la política simplemente no deja ver/tocar
//      ninguna fila). Por eso, además del resultado del write, verificamos con
//      un SELECT que la fila de prueba no existe.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * Lee el .env de la raíz del proyecto y devuelve la URL y la clave anon, o null
 * si faltan. No usa import.meta.env porque este test corre en Node (Vitest) y
 * queremos las mismas variables que usa el resto del proyecto.
 */
function leerCredenciales(): { url: string; anonKey: string } | null {
  const aqui = dirname(fileURLToPath(import.meta.url));
  const rutaEnv = resolve(aqui, '..', '..', '.env');
  const env: Record<string, string> = {};
  try {
    const contenido = readFileSync(rutaEnv, 'utf8');
    for (const lineaCruda of contenido.split('\n')) {
      const linea = lineaCruda.trim();
      if (linea === '' || linea.startsWith('#')) continue;
      const igual = linea.indexOf('=');
      if (igual === -1) continue;
      const clave = linea.slice(0, igual).trim();
      let valor = linea.slice(igual + 1).trim();
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1);
      }
      env[clave] = valor;
    }
  } catch {
    // No hay .env: caemos a process.env (útil si alguien exporta las variables).
  }
  const url = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
  const anonKey =
    env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

const credenciales = leerCredenciales();

// Si no hay credenciales, saltamos la suite entera (no rompe la CI).
const suite = credenciales ? describe : describe.skip;

suite('RLS del catálogo con la clave pública anon (T-30)', () => {
  // Toca la red real; damos margen holgado para latencia de Supabase.
  const TIMEOUT_RED_MS = 20_000;
  let anon: SupabaseClient;
  // Id de prueba, claramente marcado. No debe existir en el catálogo.
  const idPrueba = 'zzz-t30-rls-prueba';

  beforeAll(() => {
    anon = createClient(credenciales!.url, credenciales!.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  // Red de seguridad: si por lo que sea se hubiera escrito la fila, la borramos.
  // Con RLS bien puesto el DELETE no afecta nada; es solo por higiene.
  afterAll(async () => {
    if (!anon) return;
    await anon.from('atracciones').delete().eq('id', idPrueba);
  });

  it(
    'permite LEER el catálogo (la política de SELECT sí existe)',
    async () => {
      const { data, error } = await anon
        .from('atracciones')
        .select('id')
        .limit(1);
      // La lectura pública debe funcionar: es el único permiso del catálogo.
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    },
    TIMEOUT_RED_MS,
  );

  it(
    'RECHAZA un INSERT sobre atracciones con la clave anon',
    async () => {
      const fila = {
        id: idPrueba,
        municipio_id: 'armenia',
        nombre: 'Atracción de prueba RLS (no debería insertarse)',
        categoria: 'prueba',
        lat: 4.5339,
        lon: -75.6811,
        duracion_min: 60,
        al_aire_libre: false,
        fecha_actualizacion: '2026-11-12',
        fuente: 'prueba-t30',
      };

      const { data, error } = await anon
        .from('atracciones')
        .insert(fila as never)
        .select();

      // Caso (a): error explícito de RLS/permiso. Caso (b): 0 filas sin error.
      if (error) {
        // 42501 = insufficient_privilege (violación de RLS o de permiso).
        expect(
          error.code === '42501' ||
            /row-level|permission|denied/i.test(error.message),
        ).toBe(true);
      } else {
        expect(data ?? []).toHaveLength(0);
      }

      // Prueba definitiva: la fila NO quedó en la base.
      const { data: verif } = await anon
        .from('atracciones')
        .select('id')
        .eq('id', idPrueba);
      expect(verif ?? []).toHaveLength(0);
    },
    TIMEOUT_RED_MS,
  );

  it(
    'RECHAZA un UPDATE sobre atracciones con la clave anon',
    async () => {
      // Tomamos una atracción real existente para intentar modificarla.
      const { data: existentes } = await anon
        .from('atracciones')
        .select('id, nombre')
        .limit(1);
      expect((existentes ?? []).length).toBeGreaterThan(0);
      const objetivo = existentes![0] as { id: string; nombre: string };

      const nombreHackeado = 'HACKEADO POR RLS TEST (no debería persistir)';
      const { data, error } = await anon
        .from('atracciones')
        .update({ nombre: nombreHackeado })
        .eq('id', objetivo.id)
        .select();

      if (error) {
        expect(
          error.code === '42501' ||
            /row-level|permission|denied/i.test(error.message),
        ).toBe(true);
      } else {
        // Sin política de UPDATE, la fila no es "visible" para escribir: 0 filas.
        expect(data ?? []).toHaveLength(0);
      }

      // El nombre original sigue intacto.
      const { data: verif } = await anon
        .from('atracciones')
        .select('nombre')
        .eq('id', objetivo.id)
        .single();
      expect((verif as { nombre: string }).nombre).toBe(objetivo.nombre);
      expect((verif as { nombre: string }).nombre).not.toBe(nombreHackeado);
    },
    TIMEOUT_RED_MS,
  );

  it(
    'RECHAZA un DELETE sobre atracciones con la clave anon',
    async () => {
      const { data: antes } = await anon.from('atracciones').select('id');
      const totalAntes = (antes ?? []).length;
      expect(totalAntes).toBeGreaterThan(0);
      const objetivo = (antes![0] as { id: string }).id;

      const { data, error } = await anon
        .from('atracciones')
        .delete()
        .eq('id', objetivo)
        .select();

      if (error) {
        expect(
          error.code === '42501' ||
            /row-level|permission|denied/i.test(error.message),
        ).toBe(true);
      } else {
        expect(data ?? []).toHaveLength(0);
      }

      // El conteo no cambió: no se borró nada.
      const { data: despues } = await anon.from('atracciones').select('id');
      expect((despues ?? []).length).toBe(totalAntes);
    },
    TIMEOUT_RED_MS,
  );
});
