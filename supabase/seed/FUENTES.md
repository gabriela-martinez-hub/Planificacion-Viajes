# Fuentes verificadas del seed

Verificación de la tarea T-06 (2026-11-09). El seed (T-08) parte de estos datos.

## Municipios (`divipola.csv`)

- Fuente: DANE, "DIVIPOLA - Códigos municipios", publicado en datos.gov.co
  (conjunto `gdxc-w37w`, filas actualizadas el 2025-01-24, licencia CC BY-SA 4.0).
  Consulta: `https://www.datos.gov.co/resource/gdxc-w37w.json?$where=cod_dpto in('17','63','66')`
- Resultado: Caldas (17) 27, Quindío (63) 12, Risaralda (66) 14. Total 53, todos
  de tipo "Municipio". Coincide con `plan.md` sección 7.
- `divipola.csv` guarda el código DANE, el departamento, el nombre tal como lo
  publica el DANE (en mayúsculas y con tildes irregulares, p. ej. "CHINCHINA" sin
  tilde y "SAN JOSÉ" con tilde) y las coordenadas de la cabecera municipal. El
  nombre visible en la app se normaliza en el seed.

## Ruta "Pueblos patrimonio"

- Fuente: sitio oficial de la Red Turística de Pueblos Patrimonio
  (`redturisticadepueblospatrimonio.com.co`, programa de MinCIT ejecutado por
  FONTUR), consultado el 2026-11-09.
- La red tiene 18 pueblos. De Caldas, Quindío y Risaralda solo están Salamina
  (17653) y Aguadas (17013). Coincide con `plan.md` sección 1.1.
- Los otros 16 son Barichara, Ciénaga, Jardín, El Socorro, Guadalajara de Buga,
  Honda, Jericó, La Playa de Belén, Monguí, Pore, San Juan de Girón, Santa Cruz de
  Lorica, Santa Cruz de Mompox, Santa Fe de Antioquia, Villa de Guaduas y Villa de
  Leyva.

## Ruta del café: sin fuente oficial con lista definida

- No se encontró una "Ruta del café" oficial (MinCIT, FONTUR, gobernaciones) con
  una lista de municipios o atracciones. Las que aparecen son de blogs y agencias.
- Lo oficial más cercano es el Paisaje Cultural Cafetero (PCC). Su sitio oficial
  (`paisajeculturalcafetero.org.co`) dice "51 municipios" y publica un mapa por
  municipio. En los tres departamentos del MVP hay mapas de 40 municipios:
  - Caldas (18): Aguadas, Anserma, Aranzazu, Belalcázar, Chinchiná, Filadelfia,
    La Merced, Manizales, Neira, Pácora, Palestina, Riosucio, Risaralda,
    Salamina, San José, Supía, Villamaría y Viterbo.
  - Quindío (11): todos menos La Tebaida.
  - Risaralda (11): Apía, Balboa, Belén de Umbría, Dosquebradas, Guática,
    La Celia, Marsella, Pereira, Quinchía, Santa Rosa de Cabal y Santuario.
  - Con los 10 del Valle suman 50 mapas, no 51. No se resolvió cuál falta.
- El PCC se delimita por veredas: la lista indica municipios con área en el PCC,
  no municipios completos.
- Decisión del usuario (2026-11-09): la ruta se arma con atracciones cafeteras
  del seed (p. ej. Parque del Café, Recinto del Pensamiento, fincas con
  recorrido), no con los municipios del PCC. Cada atracción cita su propia
  fuente.

## Ruta de termales: sin fuente oficial con lista definida

- No se encontró una ruta de termales oficial. Los termales son atracciones
  privadas (p. ej. en Santa Rosa de Cabal, Manizales y Villamaría), así que la
  ruta tendría que definirse con las atracciones del seed (T-08).
- Decisión del usuario (2026-11-09): la ruta se arma con las atracciones
  termales del seed. Cada atracción cita su propia fuente.

## Seed del catálogo (T-08, 2026-11-10)

El seed vive en `supabase/seed/datos/` como módulos TypeScript tipados y
validados con Zod (`src/domain/catalogo/esquemas.ts`). Se carga con
`npm run seed` (script `scripts/cargar-seed.ts`, clave `service_role`).
`npm run seed:dry-run` valida sin escribir.

### Municipios y cascos urbanos
- 53 municipios desde `divipola.csv` (DANE, ver arriba). Cada municipio tiene
  una pseudoatracción "Casco urbano" con las coordenadas de la cabecera, para
  el generador y el check-in (plan.md 1.1, 7).
- Altitud de la cabecera: fichas municipales y fuentes abiertas. Donde el valor
  es aproximado, se mantiene como referencia; no afecta la selección, solo el
  ajuste de clima por altura (fase d).

### Atracciones reales (17)
- Concentradas en los municipios turísticos (Salento, Montenegro, Quimbaya,
  Filandia, Manizales, Villamaría, Aguadas, Salamina, Pereira, Santa Rosa de
  Cabal, Marsella). Cada fila cita su fuente (sitio oficial cuando existe) y
  `fecha_actualizacion`.
- Costos y horarios marcados con `costo_aproximado = true` (riesgo R-04): son
  de referencia y pueden cambiar. **El usuario debe revisarlos antes de la
  sustentación.**
- El PNN Los Nevados / Nevado del Ruiz queda con `estado_acceso = restringida`
  y `requiere_guia = true` (riesgo R-03): el acceso depende del nivel de alerta
  del volcán (SGC) y debe revisarse antes de cada entrega.

### Rutas de bus
- Grafo de tramos directos entre cabeceras por los corredores principales
  (autopista del Café, hubs de Armenia y Pereira, occidente y norte de Caldas,
  corredor del Magdalena, orígenes externos Bogotá/Medellín/Cali).
- Tiempos y tarifas son de referencia (`costo_aproximado = true`, riesgo R-04);
  **el usuario debe revisarlos antes de la sustentación.**
- El diseño garantiza que los 53 municipios quedan en una sola componente
  conexa; lo verifica `analizarConectividadBus` y la prueba `seed.test.ts`.

### Tarifas de referencia
- Alojamiento (persona/noche) y comida (persona/día) por nivel económico, medio
  y alto, como tarifas regionales (sin municipio). Valores de referencia
  (`costo_aproximado = true`); **el usuario debe revisarlos.**

### Rutas temáticas e insignias
- Pueblos patrimonio: Salamina y Aguadas (Red Turística de Pueblos Patrimonio).
- Ruta del café y ruta de termales: armadas con atracciones del seed (decisión
  del usuario 2026-11-09).
- Insignias: por departamento (3), del eje (53 municipios) y por ruta (3).

### Clima mensual
- Vacío en este seed. Lo genera la tarea T-25 con el script reanudable que
  consulta la API histórica de Open-Meteo respetando su cuota (plan.md 6.3,
  riesgo R-02).
