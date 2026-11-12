// Prueba end-to-end del flujo principal (T-22, plan.md fase final, 1.3).
//
// Un único flujo que recorre las fases del producto, con toda la red
// interceptada (e2e/mocks.ts) y una sesión sembrada en localStorage:
//   1. Explorar el catálogo (pantalla inicial).
//   2. Planificar: llenar el formulario y generar un itinerario.
//   3. Presupuesto: ajustar a un monto fijo.
//   4. Clima: ver la atribución y reorganizar por clima (un día es lluvioso).
//   5. Guardar el viaje (hay sesión).
//   6. Check-in: en la ficha de una atracción, con geolocalización.
//
// La prueba NO toca Supabase ni Open-Meteo reales. La geolocalización se fija en
// el contexto (plan.md 6.4). Los textos se seleccionan por los strings es-CO.

import { test, expect } from '@playwright/test';
import { sembrarSesion, interceptarRed } from './mocks';

test.describe('Flujo principal del planificador', () => {
  test.beforeEach(async ({ context, page }) => {
    await sembrarSesion(context);
    await interceptarRed(page);
    // Coordenadas dentro del Valle de Cocora (Salento) para el check-in geo.
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 4.63778, longitude: -75.48833 });
  });

  test('explorar, planificar, presupuesto, clima, guardar y check-in', async ({
    page,
  }) => {
    // --- 1. La pantalla inicial redirige a Explorar ---
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        name: 'Planificador de viajes del Eje Cafetero',
      }),
    ).toBeVisible();
    // Con sesión sembrada, se ofrece cerrar sesión (no iniciar).
    await expect(
      page.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeVisible();

    // --- 2. Planificar ---
    await page.getByRole('link', { name: 'Planificar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Planifica tu viaje' }),
    ).toBeVisible();

    // Fechas: ida mañana, regreso en 3 días (dentro del horizonte de pronóstico).
    const hoy = new Date();
    const ida = new Date(hoy);
    ida.setDate(hoy.getDate() + 1);
    const regreso = new Date(hoy);
    regreso.setDate(hoy.getDate() + 3);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    // Los campos usan <label><span>Texto</span><control/></label> sin htmlFor,
    // así que localizamos el control dentro del <label> que contiene su texto.
    const campo = (texto: string) => page.locator('label', { hasText: texto });

    await campo('Nombre del viaje')
      .locator('input')
      .fill('Fin de semana en el Quindío');
    await campo('Punto de partida')
      .locator('select')
      .selectOption({ label: 'Armenia' });
    await campo('Fecha de ida').locator('input').fill(iso(ida));
    await campo('Fecha de regreso').locator('input').fill(iso(regreso));
    await campo('Número de viajeros').locator('input').fill('2');
    await campo('Nivel del viaje')
      .locator('select')
      .selectOption({ label: 'Medio' });

    // Estilos: naturaleza (el checkbox es sr-only; se clica por el texto).
    await page.getByText('Naturaleza', { exact: true }).click();

    // Municipios: buscar y marcar Salento y Filandia.
    const buscador = page.getByRole('searchbox', {
      name: 'Municipios que quieres visitar',
    });
    await buscador.fill('Salento');
    await page.getByRole('checkbox', { name: 'Salento' }).check();
    await buscador.fill('Filandia');
    await page.getByRole('checkbox', { name: 'Filandia' }).check();

    // Generar el itinerario.
    await page.getByRole('button', { name: 'Generar itinerario' }).click();

    // Debe aparecer al menos un día del itinerario.
    await expect(page.getByText(/^Día 1/).first()).toBeVisible();

    // --- 3. Presupuesto ---
    await expect(
      page.getByRole('heading', { name: 'Presupuesto' }).first(),
    ).toBeVisible();

    // Para forzar un ajuste real (bajar de nivel), pedimos un monto por debajo
    // del total estimado que muestra el desglose. Si pusiéramos un monto
    // holgado, el viaje ya cabría y no habría nada que ajustar.
    const filaTotal = page
      .locator('div')
      .filter({ hasText: /^Total estimado\$/ })
      .last();
    const totalTexto = (await filaTotal.textContent()) ?? '';
    const totalCop = Number(totalTexto.replace(/[^0-9]/g, ''));
    expect(totalCop).toBeGreaterThan(0);
    const montoObjetivo = Math.max(1, Math.floor(totalCop * 0.75));

    await campo('Presupuesto total del grupo')
      .locator('input')
      .fill(String(montoObjetivo));
    await page
      .getByRole('button', { name: 'Ajustar a mi presupuesto' })
      .click();

    // El ajuste produce un resultado: ajustado (status) o no alcanza (alert).
    // Ambos demuestran que el paso 8 corrió; con 75 % del total lo normal es
    // que ajuste bajando de nivel.
    await expect(
      page
        .getByText('Itinerario ajustado a tu presupuesto')
        .or(page.getByText(/El presupuesto no alcanza/)),
    ).toBeVisible();

    // --- 4. Clima ---
    await expect(page.getByText('Datos del clima: Open-Meteo')).toBeVisible();
    const reorganizar = page.getByRole('button', {
      name: 'Reorganizar por clima',
    });
    // El primer día es lluvioso en el mock: el botón debe habilitarse.
    await expect(reorganizar).toBeEnabled();
    await reorganizar.click();
    // Aparece la vista previa o el aviso de que no hay nada que reorganizar.
    await expect(
      page
        .getByText('Vista previa de los cambios')
        .or(page.getByText(/No hay nada que reorganizar/)),
    ).toBeVisible();

    // --- 5. Guardar el viaje (hay sesión) ---
    const guardar = page.getByRole('button', { name: 'Guardar viaje' });
    await expect(guardar).toBeVisible();
    await guardar.click();
    await expect(page.getByText('Viaje guardado en tu cuenta.')).toBeVisible();

    // --- 6. Check-in en la ficha de una atracción ---
    await page.getByRole('link', { name: 'Explorar' }).click();
    await page.getByRole('tab', { name: 'Atracciones' }).click();
    // Abrir la ficha del Valle de Cocora.
    await page.getByRole('button', { name: /Valle de Cocora/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Valle de Cocora' }),
    ).toBeVisible();

    // La sección de check-in está presente (hay sesión).
    const checkin = page.getByRole('button', {
      name: 'Hacer check-in con mi ubicación',
    });
    await expect(checkin).toBeVisible();
    await checkin.click();

    // Si apareciera el modal de consentimiento (primer check-in), lo aceptamos;
    // con el consentimiento ya sembrado normalmente no aparece.
    const aceptar = page.getByRole('button', { name: 'Acepto' });
    if (await aceptar.isVisible().catch(() => false)) {
      await aceptar.click();
    }

    // El mock marca el check-in geo como verificado.
    await expect(
      page.getByText(/Check-in verificado en Valle de Cocora/),
    ).toBeVisible();
  });
});
