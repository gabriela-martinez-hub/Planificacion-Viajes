# Planificacion-Viajes

Catálogo de atractivos turísticos, exploración geográfica, creación de itinerarios y estimación transparente de presupuestos.

PWA para planificar viajes por Caldas, Quindío y Risaralda según fechas, presupuesto y clima. El diseño aprobado está en [`plan.md`](plan.md).

## Requisitos

- Node.js 22 (ver `.nvmrc`). Con nvm-windows: `nvm use 22`.
- npm 10+.

## Puesta en marcha

```bash
npm install        # instala dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # compila (tsc -b && vite build) a dist/
npm run preview    # sirve el build de producción
npm test           # pruebas unitarias (Vitest)
npm run lint       # ESLint (0 warnings permitidos)
npm run format     # formatea con Prettier
```

## Stack

React + TypeScript + Vite, Tailwind CSS, ESLint + Prettier, Vitest + Testing Library. Backend con Supabase (se configura en fases posteriores; ver `plan.md` sección 9). Los textos de interfaz viven en `src/i18n/es-CO.ts`.

## Estructura

La organización de carpetas sigue la sección 8 de `plan.md`: `src/domain` (lógica pura), `src/services`, `src/features`, `src/components`, `src/i18n`, `src/lib`, `src/types`, además de `supabase/` y `scripts/`.
