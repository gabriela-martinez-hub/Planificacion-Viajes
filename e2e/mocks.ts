// Interceptores de red y sesión para la prueba e2e (T-22).
//
// La prueba del flujo principal no toca servicios reales: aquí se interceptan
// con page.route todas las llamadas salientes (Supabase REST + RPC y Open-Meteo)
// y se siembra una sesión válida en localStorage para que la app crea que hay un
// usuario con sesión, sin pasar por OAuth real. Los datos del catálogo son el
// seed real (construirSeed), remodelado al formato que PostgREST devolvería y
// que cada servicio de src/services/catalogo.ts espera de su .select().

import type { BrowserContext, Page, Route } from '@playwright/test';
import { construirSeed } from '../supabase/seed/datos';

const SUPABASE_HOST = 'https://pruebas.supabase.co';
const USUARIO_ID = '00000000-0000-4000-8000-000000000001';

/** Catálogo real del seed, ya validado por Zod. */
const seed = construirSeed();

// ----------------------------------------------------------- utilidades REST

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });
}

/** ¿La URL consulta esta tabla/endpoint de PostgREST? */
function esTabla(url: string, tabla: string): boolean {
  return url.includes(`/rest/v1/${tabla}`);
}

// ----------------------------------------------------------- formas REST

// El servicio de catálogo lee municipios con nodos anidados (nodos!inner) y
// orígenes externos igual. Reconstruimos esa forma a partir del seed de dominio.

function filasMunicipios() {
  return seed.municipios.map((m) => ({
    id: m.id,
    departamento_id: m.departamento_id,
    codigo_dane: m.codigo_dane,
    altitud_m: m.altitud_m,
    es_pueblo_patrimonio: m.es_pueblo_patrimonio,
    radio_checkin_m: m.radio_checkin_m,
    nodos: { nombre: m.nombre, lat: m.lat, lon: m.lon },
  }));
}

function filasOrigenes() {
  return seed.origenes_externos.map((o) => ({
    id: o.id,
    nodos: { nombre: o.nombre, lat: o.lat, lon: o.lon },
  }));
}

// atracciones es `select *`: el seed de dominio ya tiene la forma de columnas.
function filasAtracciones() {
  return seed.atracciones;
}

// ----------------------------------------------------------- Open-Meteo

/**
 * Respuesta de Open-Meteo para los lugares pedidos. Devuelve 16 días desde
 * `desde`. El primer día se fuerza lluvioso (prob 90, 12 mm) para habilitar el
 * botón "Reorganizar por clima"; el resto, seco. Open-Meteo devuelve un objeto
 * si se pide un lugar y un arreglo si se piden varios: respetamos esa forma.
 */
function respuestaOpenMeteo(url: string) {
  const u = new URL(url);
  const lats = (u.searchParams.get('latitude') ?? '')
    .split(',')
    .filter(Boolean);
  const lons = (u.searchParams.get('longitude') ?? '')
    .split(',')
    .filter(Boolean);
  const n = Math.max(lats.length, 1);

  const hoy = new Date();
  const fechas: string[] = [];
  for (let i = 0; i < 16; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    fechas.push(d.toISOString().slice(0, 10));
  }
  // El viaje de la prueba empieza mañana (índice 1). Marcamos lluvioso el primer
  // día del viaje (índice 1) y dejamos secos los siguientes, para que haya a la
  // vez un día lluvioso y días secos a donde mover las actividades al aire libre
  // (habilita y da sentido a "Reorganizar por clima").
  const diasLluviosos = new Set([1]);
  const prob = fechas.map((_, i) => (diasLluviosos.has(i) ? 90 : 5));
  const precip = fechas.map((_, i) => (diasLluviosos.has(i) ? 15 : 0));

  const bloque = (lat: string, lon: string) => ({
    latitude: Number(lat) || 4.5,
    longitude: Number(lon) || -75.6,
    daily: {
      time: fechas,
      precipitation_sum: precip,
      precipitation_probability_max: prob,
      temperature_2m_max: fechas.map(() => 25),
      temperature_2m_min: fechas.map(() => 15),
    },
  });

  if (n <= 1) return bloque(lats[0] ?? '4.5', lons[0] ?? '-75.6');
  return lats.map((lat, i) => bloque(lat, lons[i] ?? '-75.6'));
}

// ----------------------------------------------------------- sesión sembrada

/**
 * Siembra una sesión válida de supabase-js en localStorage antes de cargar la
 * app. supabase-js deriva la clave de almacenamiento de la URL del proyecto:
 * `sb-<primer-segmento-del-host>-auth-token` (ver SupabaseClient). Para
 * https://pruebas.supabase.co queda `sb-pruebas-auth-token`. expires_at en el
 * futuro evita que el SDK intente refrescar el token (no hay red de auth
 * mockeada). AuthProvider solo usa getSession() y session.user, así que esto
 * basta para que haya "usuario".
 */
export async function sembrarSesion(context: BrowserContext) {
  const host = new URL(SUPABASE_HOST).hostname.split('.')[0];
  const claveSesion = `sb-${host}-auth-token`;
  const expiraEn = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // +24 h
  const sesion = {
    access_token: 'token-de-prueba-e2e',
    refresh_token: 'refresh-de-prueba-e2e',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24,
    expires_at: expiraEn,
    user: {
      id: USUARIO_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'prueba.e2e@example.com',
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: { full_name: 'Viajera de Prueba' },
      created_at: new Date().toISOString(),
    },
  };
  await context.addInitScript(
    ([clave, valor]) => {
      window.localStorage.setItem(clave, valor);
    },
    [claveSesion, JSON.stringify(sesion)] as const,
  );
}

// ----------------------------------------------------------- enrutado

/**
 * Intercepta toda la red de Supabase y Open-Meteo. Devuelve el seed para el
 * catálogo, una respuesta coherente para la RPC de check-in, consentimiento ya
 * dado, y respuestas vacías/ok para el resto (viajes, insignias, etc.).
 */
export async function interceptarRed(page: Page) {
  // ------------------ Open-Meteo (pronóstico) ------------------
  await page.route(/https:\/\/api\.open-meteo\.com\/v1\/forecast.*/, (route) =>
    json(route, respuestaOpenMeteo(route.request().url())),
  );

  // ------------------ Supabase REST + RPC + Auth ------------------
  await page.route(`${SUPABASE_HOST}/**`, async (route) => {
    const req = route.request();
    const url = req.url();
    const metodo = req.method();

    // Preflight CORS.
    if (metodo === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
          'access-control-allow-headers': '*',
        },
      });
    }

    // Auth: por si el SDK consulta el usuario, devolvemos el de la sesión.
    if (url.includes('/auth/v1/user')) {
      return json(route, {
        id: USUARIO_ID,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'prueba.e2e@example.com',
        user_metadata: { full_name: 'Viajera de Prueba' },
        app_metadata: { provider: 'google' },
      });
    }

    // --- Lecturas del catálogo ---
    if (esTabla(url, 'departamentos')) return json(route, seed.departamentos);
    if (esTabla(url, 'municipios')) return json(route, filasMunicipios());
    if (esTabla(url, 'atracciones') && metodo === 'GET')
      return json(route, filasAtracciones());
    if (esTabla(url, 'origenes_externos')) return json(route, filasOrigenes());
    if (esTabla(url, 'rutas_bus')) return json(route, seed.rutas_bus);
    if (esTabla(url, 'tarifas_referencia'))
      return json(route, seed.tarifas_referencia);
    if (esTabla(url, 'rutas_tematicas'))
      return json(route, seed.rutas_tematicas);
    if (esTabla(url, 'ruta_items')) return json(route, seed.ruta_items);
    if (esTabla(url, 'clima_mensual')) return json(route, seed.clima_mensual);

    // --- Perfil: consentimiento YA dado (evita el modal en el check-in) ---
    // obtenerConsentimiento usa .maybeSingle(): PostgREST devuelve un objeto
    // (o null), no un arreglo. Hay que responder con el objeto directamente.
    if (esTabla(url, 'perfiles')) {
      if (metodo === 'GET')
        return json(route, {
          consentimiento_datos_en: new Date().toISOString(),
        });
      // upsert del consentimiento u otros: ok vacío.
      return json(route, [], 201);
    }

    // --- RPC registrar_checkin: devuelve una fila de check-in verificada ---
    if (url.includes('/rest/v1/rpc/registrar_checkin')) {
      const cuerpo = (req.postDataJSON() ?? {}) as {
        p_lugar_id?: string;
        p_manual?: boolean;
      };
      const manual = cuerpo.p_manual === true;
      const atraccion = seed.atracciones.find(
        (a) => a.id === cuerpo.p_lugar_id,
      );
      return json(route, {
        id: '00000000-0000-4000-8000-0000000000aa',
        id_cliente: '00000000-0000-4000-8000-0000000000bb',
        usuario_id: USUARIO_ID,
        atraccion_id: atraccion ? atraccion.id : null,
        municipio_id: atraccion ? atraccion.municipio_id : 'armenia',
        recibido_en: new Date().toISOString(),
        // Geo: verificado; manual: no verificado (como el servidor real).
        verificado: !manual,
        distancia_m: manual ? null : 10,
        precision_m: manual ? null : 8,
      });
    }

    // --- Check-ins / insignias / viajes: lectura vacía, escritura ok ---
    if (esTabla(url, 'checkins')) return json(route, []);
    if (esTabla(url, 'insignias_usuario')) return json(route, []);
    if (esTabla(url, 'viajes')) {
      if (metodo === 'POST')
        return json(route, { id: '00000000-0000-4000-8000-0000000000cc' }, 201);
      return json(route, []);
    }
    if (esTabla(url, 'viaje_dias') || esTabla(url, 'viaje_items'))
      return json(route, [], 201);

    // Cualquier otra cosa: respuesta vacía para no romper la app.
    return json(route, []);
  });
}

export { USUARIO_ID, SUPABASE_HOST };
