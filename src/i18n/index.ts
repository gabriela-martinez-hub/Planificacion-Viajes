import { textos } from './es-CO';

type Arbol = typeof textos;

/** Claves con puntos de todos los textos, p. ej. 'auth.saludo'. */
type Hojas<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : Hojas<T[K], `${P}${K}.`>;
}[keyof T & string];

export type Clave = Hojas<Arbol>;

type Texto<T, K extends string> = K extends `${infer A}.${infer R}`
  ? A extends keyof T
    ? Texto<T[A], R>
    : never
  : K extends keyof T
    ? T[K]
    : never;

/** Nombres de los marcadores {x} de un texto. */
type Marcadores<S> = S extends `${string}{${infer M}}${infer R}`
  ? M | Marcadores<R>
  : never;

type Parametros<K extends Clave> = [Marcadores<Texto<Arbol, K>>] extends [never]
  ? []
  : [parametros: Record<Marcadores<Texto<Arbol, K>>, string | number>];

function buscar(clave: string): string | undefined {
  let nodo: unknown = textos;
  for (const parte of clave.split('.')) {
    if (
      typeof nodo !== 'object' ||
      nodo === null ||
      !Object.hasOwn(nodo, parte)
    ) {
      return undefined;
    }
    nodo = (nodo as Record<string, unknown>)[parte];
  }
  return typeof nodo === 'string' ? nodo : undefined;
}

/** Para claves que llegan como texto (p. ej. clave_texto de la base). */
export function esClave(clave: string): clave is Clave {
  return buscar(clave) !== undefined;
}

/**
 * Devuelve el texto de la clave con los marcadores reemplazados.
 * TypeScript exige los parámetros que el texto necesita.
 */
export function t<K extends Clave>(
  clave: K,
  ...[parametros]: Parametros<K>
): string {
  const texto = buscar(clave) ?? clave;
  if (!parametros) return texto;
  const valores = parametros as Record<string, string | number>;
  return texto.replace(/\{(\w+)\}/g, (marca, nombre: string) =>
    Object.hasOwn(valores, nombre) ? String(valores[nombre]) : marca,
  );
}
