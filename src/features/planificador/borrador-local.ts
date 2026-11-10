// Borrador de viaje sin cuenta, guardado en IndexedDB (T-14, pieza B).
//
// Si el usuario genera un itinerario sin iniciar sesión, se guarda aquí para que
// no lo pierda. Al iniciar sesión se le ofrece subirlo a su cuenta (supuesto
// 1.2.3 de plan.md). Solo se guarda un borrador a la vez (clave fija 'actual').
//
// Usa `idb` (capa async/await sobre IndexedDB). Toda la lógica de red y de
// Supabase vive fuera; aquí solo se persiste localmente.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Itinerario } from '@/domain/itinerario';
import type { FormularioViaje } from '@/domain/viaje/esquemas';

/** Lo que se guarda: el formulario validado y el itinerario ya generado. */
export interface BorradorViaje {
  formulario: FormularioViaje;
  itinerario: Itinerario;
  /** Momento del guardado (ISO), para mostrarlo al usuario si hace falta. */
  guardadoEn: string;
}

interface EsquemaBorrador extends DBSchema {
  borrador: {
    key: string;
    value: BorradorViaje;
  };
}

const NOMBRE_BASE = 'viajes-locales';
const ALMACEN = 'borrador';
const CLAVE = 'actual';

let promesaBase: Promise<IDBPDatabase<EsquemaBorrador>> | null = null;

function base(): Promise<IDBPDatabase<EsquemaBorrador>> {
  promesaBase ??= openDB<EsquemaBorrador>(NOMBRE_BASE, 1, {
    upgrade(db) {
      db.createObjectStore(ALMACEN);
    },
  });
  return promesaBase;
}

/** Guarda (o reemplaza) el borrador local. */
export async function guardarBorrador(
  formulario: FormularioViaje,
  itinerario: Itinerario,
): Promise<void> {
  const db = await base();
  await db.put(
    ALMACEN,
    { formulario, itinerario, guardadoEn: new Date().toISOString() },
    CLAVE,
  );
}

/** Devuelve el borrador local o null si no hay. */
export async function leerBorrador(): Promise<BorradorViaje | null> {
  const db = await base();
  return (await db.get(ALMACEN, CLAVE)) ?? null;
}

/** Borra el borrador local (tras subirlo o descartarlo). */
export async function borrarBorrador(): Promise<void> {
  const db = await base();
  await db.delete(ALMACEN, CLAVE);
}
