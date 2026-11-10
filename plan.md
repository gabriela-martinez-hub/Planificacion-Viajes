# Plan de construcción: Planificador de viajes del Eje Cafetero

Aplicación web responsive (mobile-first) para planificar viajes por Caldas, Quindío y
Risaralda según fechas, presupuesto y clima, con insignias por lugares visitados.

---

## 1. Revisión del prompt original

El prompt está bien estructurado: define objetivo, funcionalidades, datos, requisitos y
forma de trabajo por fases. Estos son los puntos que había que ajustar y cómo quedan
resueltos en este plan (el prompt revisado completo está en el Anexo A).

| # | Problema en el prompt original | Ajuste |
|---|---|---|
| 1 | El stack quedó como plantilla sin llenar (`[escribe aquí tu stack...]`). | Se propone un stack por defecto (sección 3), sujeto a aprobación. |
| 2 | No dice cómo se genera el itinerario (¿reglas? ¿IA?). | Algoritmo determinista formulado como problema de optimización (secciones 6.0 y 6.1). Un LLM queda como mejora opcional, no como dependencia. |
| 3 | No dice de dónde salen los tiempos de desplazamiento ni los costos de transporte, alojamiento y comida. | Grafo de rutas de bus directas con tiempo y tarifa, y tabla de tarifas de referencia por nivel (económico, medio, alto), ambas con fecha de actualización y fuente. |
| 4 | El presupuesto no aclara si es total o por persona, ni qué pasa si no alcanza. | Se ingresa el total del grupo y se muestra también por persona. Si no alcanza ni con el mínimo, la app lo dice, muestra el mínimo y sugiere acortar el viaje o cambiar de nivel. |
| 5 | La meta de ahorro no define cómo se registra el progreso. | El usuario registra aportes manualmente. No hay conexión bancaria. |
| 6 | Clima: no indica qué coordenadas usar ni qué hacer si la API falla. | Pronóstico por municipio (lat/lon del casco urbano) o por atracción extensa, caché de 3 h y, si la API falla, se usa el promedio histórico con aviso. Los promedios mensuales se precalculan en el seed. |
| 7 | Check-in por geolocalización sin radio, precisión ni privacidad definidos. | Radio por lugar, regla de precisión GPS, validación en el servidor y sin guardar coordenadas del usuario (sección 6.4). |
| 8 | No contempla mala conectividad en zonas rurales (Cocora, termales, veredas). | PWA con el itinerario disponible para lectura sin conexión. El check-in requiere conexión y el mapa base no funciona offline (política de teselas de OSM, sección 6.5). |
| 9 | "Pueblos patrimonio" y "ruta del café" no tienen lista definida. | Las listas se verifican con fuentes oficiales durante la fase (a) y se guardan en el seed. |
| 10 | Falta definir qué queda fuera del alcance. | Sección 2.2: sin reservas, pagos ni contenido generado por usuarios en el MVP. |
| 11 | No hay criterios de aceptación ni pruebas. | Cada fase tiene criterios de aceptación medibles. Se piden pruebas unitarias para itinerario, presupuesto, clima, geo e insignias, y pruebas de las políticas RLS. |
| 12 | No menciona licencias de datos. | Atribución obligatoria de OpenStreetMap (ODbL) y Open-Meteo (CC BY 4.0; su plan gratuito es para uso no comercial). |
| 13 | Paisaje Cultural Cafetero (UNESCO) incluye también municipios del norte del Valle del Cauca. | Los municipios del Valle quedan para una versión posterior (sección 2.3). |
| 14 | No menciona datos personales. | Política de tratamiento de datos (Ley 1581 de 2012), consentimiento antes del primer check-in y opción de eliminar la cuenta. |

### 1.1 Decisiones tomadas (respuestas del 7 de noviembre de 2026)

| Tema | Decisión | Impacto en el plan |
|---|---|---|
| Stack | Aprobado el de la sección 3. | La internacionalización se simplificó (ver fila "Idioma"): no se usa react-i18next en el MVP. |
| Alcance geográfico | Solo Caldas, Quindío y Risaralda en el MVP. Los municipios del Valle del Cauca del PCC quedan para una versión posterior (decisión del 7 de noviembre de 2026, segunda ronda). | 53 municipios. Lo ya investigado sobre el Valle se conserva en la sección 2.3 para la versión posterior. |
| Ruta "Pueblos patrimonio" | Se mantiene con Salamina y Aguadas, los dos pueblos de la [Red Turística de Pueblos Patrimonio](https://fontur.com.co/es/programas/red-turistica-de-pueblos-patrimonio) que están en el catálogo. | `es_pueblo_patrimonio = true` en 2 municipios; la ruta tiene 2 ítems. |
| Insignias especiales con registros manuales | Una insignia especial es verificada si al menos el 80 % de sus componentes tienen check-in verificado. | Para obtenerla siguen haciendo falta check-ins (verificados o manuales) en todos sus componentes. Regla en la sección 6.4. |
| Itinerario | Solo algoritmo por reglas, sin IA generativa. | El generador es determinista: construcción voraz más búsqueda local con desempates fijos (sección 6.0). Sin dependencias de LLM. |
| Transporte | Bus intermunicipal. | Grafo de rutas directas de bus con tiempo y tarifa; los trayectos con trasbordo se calculan con Dijkstra. Los desplazamientos dentro de un municipio o a atracciones rurales (p. ej. Salento → Cocora en Willys) se cubren con un tiempo y costo de transporte local por atracción. |
| Punto de partida | Lo elige el usuario. | Campo de origen en el viaje; el primer día incluye el traslado desde el origen. |
| Autenticación | Google. | Supabase Auth con proveedor Google (OAuth). |
| Uso | Académico. | Compatible con el plan gratuito no comercial de Open-Meteo y la política de uso de teselas de OSM (tráfico bajo, con atribución, sin precarga). |
| Seed de atracciones | 40–60 para empezar. | Además, cada municipio tiene una pseudoatracción "Casco urbano" para el generador y el check-in. |
| Idioma | Español, con internacionalización simplificada (decisión de la segunda ronda). | Todos los textos de interfaz en un único archivo tipado `src/i18n/es-CO.ts` con una función `t(clave)`; moneda y fechas con `Intl` y el locale `es-CO`. Sin react-i18next ni regla de lint. Agregar otro idioma después implica crear otro archivo con las mismas claves (TypeScript avisa si falta alguna) o migrar a react-i18next. |

### 1.2 Supuestos confirmados (7 de noviembre de 2026, tercera ronda)

1. **Origen:** el usuario elige como origen cualquier municipio del catálogo o una ciudad externa principal (Bogotá, Medellín, Cali) con tiempo y tarifa de bus aproximados.
2. **Regreso:** el itinerario incluye el traslado de vuelta al origen el último día, y su costo entra en el presupuesto.
3. **Uso sin cuenta:** se puede explorar el catálogo y generar un itinerario sin iniciar sesión. Ese itinerario se guarda en IndexedDB y, al iniciar sesión, se ofrece subirlo a la cuenta. Se pide iniciar sesión con Google solo para guardar en la nube, registrar aportes y hacer check-in.
4. **Insignia "Eje Cafetero":** se otorga al visitar los 53 municipios de Caldas, Quindío y Risaralda. Es un reto de largo plazo: municipios como Norcasia, Samaná o Marulanda quedan a varias horas de Manizales.

### 1.3 Recortes de alcance

La revisión adversaria (sección 1.4) consideró que el alcance era amplio para un
proyecto de posgrado.

Aplicados (decisiones del 7 de noviembre de 2026, segunda y cuarta ronda):

| Recorte | Ahorro |
|---|---|
| Los municipios del Valle del Cauca del PCC pasan a una versión posterior (sección 2.3). | Seed de 10 municipios, verificación de la delimitación del PCC y la insignia "Valle cafetero (PCC)". |
| La internacionalización se reduce a un único archivo `es-CO` tipado más `Intl`, sin react-i18next ni regla de lint. | Una dependencia, la configuración de lint y las descripciones del catálogo por idioma. |
| Arrastrar y soltar (dnd-kit) se reemplaza por botones "subir" y "bajar" accesibles (decisión de la cuarta ronda). | Una dependencia y casos de prueba táctiles. |
| Se quita la cola offline de check-ins: el check-in requiere conexión y offline solo se lee el itinerario (cuarta ronda). | Sincronización diferida y validación de marcas de tiempo del cliente. |
| Un único flujo end-to-end en Playwright (cuarta ronda). | Mantenimiento de pruebas e2e. |

Las rutas temáticas se mantienen, incluida "Pueblos patrimonio" con 2 municipios.
No quedan recortes pendientes.

Lo que no se recorta: generador con evaluación (6.0), presupuesto y clima.

### 1.4 Revisión adversaria (7 de noviembre de 2026)

Un revisor independiente analizó la versión anterior del plan. Estos son los hallazgos
críticos y altos, y dónde quedan resueltos:

| Hallazgo | Sección |
|---|---|
| Catálogo escribible por cualquiera: faltaba RLS en las tablas de catálogo. | 5.3 |
| Insignias falsificables si se calculan en el cliente. Ahora el check-in pasa por una RPC del servidor y el cliente no escribe insignias. | 5.3, 6.4 |
| Matriz completa de buses inviable (unos 4.300 pares). Se reemplaza por un grafo de rutas directas. | 5.1, 6.1, 7 |
| El modelo de datos no tenía campos que la lógica usa: municipio base por día, horarios, tiempo desde el casco, prioridad, entrada del generador. | 5 |
| Alojamiento sin unidad para grupos; noches sin definir. | 6.2 |
| Contradicción entre "nunca supera el monto fijo" y "no alcanza". | 6.2, fase (c) |
| Orden indefinido entre pasada de clima y pasada de presupuesto. | 6.1 |
| Determinismo sin regla de desempate y con clima variable. | 6.0, 6.1 |
| Traslado desde Bogotá (7–9 h) incompatible con el límite de jornada. | 6.1 |
| Ajuste de presupuesto sin criterio de parada y con división por cero en atracciones gratuitas. | 6.1 |
| Faltaban claves primarias, unicidades y CHECK; claves foráneas polimórficas. | 5 |
| Se guardaban coordenadas del usuario sin necesidad (Ley 1581 de 2012). | 5.2, 6.4 |
| Precisión de 200 m frente a radio de 300 m permitía verificar a casi 500 m. | 6.4 |
| El PCC se delimita por veredas, no por municipios; las fuentes citadas eran de prensa. | 2.3 (el Valle pasó a una versión posterior) |
| La ruta "Pueblos patrimonio" solo tiene 2 municipios en el catálogo. | 1.1 (se mantiene con esos 2) |
| Faltaba formulación del problema y métrica de evaluación para un curso de Sistemas Inteligentes. | 6.0, fase (b) |

Los hallazgos medios (cuota de ahorro, costos duplicados, accesos restringidos, microclimas,
cuota de Open-Meteo, teselas offline, duplicados de check-in, OAuth, pausa de Supabase,
pruebas faltantes) quedan aplicados en las secciones 5 a 9.

---

## 2. Alcance

### 2.1 MVP (incluido)
- Catálogo de municipios y atracciones con mapa: los 53 municipios de Caldas, Quindío y Risaralda.
- Generador de itinerarios día por día, desde el origen que elija el usuario, con bus intermunicipal; editable, reordenable y guardable.
- Presupuesto en dos modos: fijo y viaje soñado con meta de ahorro.
- Clima: pronóstico (≤ 16 días) o promedio histórico, con reorganización por lluvia.
- Insignias, check-in por geolocalización o manual ("no verificado"), perfil con mapa y progreso.
- Inicio de sesión con Google, interfaz en español (es-CO) con textos centralizados en un archivo, moneda COP.
- Política de tratamiento de datos y opción de eliminar la cuenta.

### 2.2 Fuera del alcance del MVP
- Municipios del Valle del Cauca del PCC (sección 2.3).
- Otros idiomas distintos de `es-CO`.
- Reservas o pagos de alojamiento, transporte o tours.
- Reseñas, fotos o contenido de otros usuarios.
- Itinerarios compartidos o colaborativos (posible fase posterior).
- Panel de administración: el catálogo se mantiene con archivos seed versionados.
- Mapa base sin conexión (no lo permite la política de teselas de OSM).
- Check-in sin conexión: requiere red para validarse en el servidor.
- Detección de GPS falseado: una PWA no puede detectarlo; se acepta como limitación.

### 2.3 Versión posterior: municipios del Valle del Cauca (PCC)

Notas para cuando se retome, a partir de lo investigado:
- Lista de trabajo de 10 municipios: Alcalá, Ansermanuevo, Argelia, Caicedonia, El
  Águila, El Cairo, Riofrío, Sevilla, Trujillo y Ulloa. Viene de prensa
  ([Caracol Radio, 2026](https://caracol.com.co/2026/01/21/el-valle-del-cauca-se-muestra-ante-el-mundo-en-espana-con-la-fitur-2026/);
  [Infobae, 2022](https://www.infobae.com/america/colombia/2022/02/04/conozca-los-destinos-cafeteros-imperdibles-en-el-valle-del-cauca/))
  y las dos fuentes no coinciden sobre Argelia.
- Hay que contrastarla con la delimitación oficial: expediente de
  [UNESCO 1121](https://whc.unesco.org/en/list/1121) y
  [Ley 2245 de 2022](https://normograma.mincultura.gov.co/compilacion/docs/ley_2245_2022.htm),
  que habla de 51 municipios en los cuatro departamentos.
- El PCC se delimita por veredas, no por municipios completos. En el Valle el área es
  casi toda rural, así que la insignia debe describirse como "municipios del Valle con
  área en el PCC", no como "visitó el PCC".
- Cambios previstos en el modelo: `departamentos.cobertura` (completo|pcc_parcial),
  `municipios.incluye_area_pcc` y `zona_pcc` (principal|amortiguamiento), tipo de
  insignia `valle_pcc` y Cartago como nodo de trasbordo en el grafo de buses.
- Solo entrarían atracciones con fuente verificable de costo y duración.

---

## 3. Stack propuesto

| Capa | Elección | Motivo |
|---|---|---|
| Frontend | React + TypeScript + Vite | Tipado estricto, ecosistema amplio, build rápido. |
| Estilos | Tailwind CSS | Mobile-first por diseño, rápido para prototipar. |
| Enrutamiento | React Router | Estándar en apps React sin SSR. |
| Datos remotos | TanStack Query | Caché, reintentos y estados de error para Supabase y Open-Meteo. |
| Validación | Zod | Valida respuestas de APIs externas y formularios con los mismos tipos. |
| Backend / BD / Auth | Supabase (Postgres + Auth con Google + Row Level Security) | Auth lista con proveedor Google, SQL real para el modelo relacional, capa gratuita suficiente. |
| Textos e idioma | Archivo tipado `src/i18n/es-CO.ts` + `t(clave)` + `Intl` | Sin dependencia extra. TypeScript detecta claves inexistentes. Moneda, números y fechas con `Intl` y el locale `es-CO`. |
| Mapas | Leaflet + react-leaflet + teselas de OpenStreetMap | Gratis, sin API key, ligero en móvil. |
| Reordenar ítems | Botones "subir" y "bajar" | Accesibles por teclado y táctil sin dependencia extra. |
| Offline | vite-plugin-pwa (Workbox) | Lectura del itinerario sin conexión. |
| Pruebas | Vitest + Testing Library; Playwright para un flujo end-to-end | Integración nativa con Vite. |
| Despliegue | Vercel o Netlify (frontend) + Supabase | Gratis para el alcance del proyecto. |

Alternativa considerada: Next.js. Se descarta para el MVP porque la app no necesita SEO
ni renderizado en servidor, y Supabase ya cubre el backend.

**Estado:** aprobado el 7 de noviembre de 2026. En la segunda ronda se reemplazó
react-i18next por el archivo de textos tipado. En la cuarta ronda se quitó dnd-kit.

---

## 4. Arquitectura

```
[Navegador / PWA]
  ├─ UI (React)
  ├─ Dominio puro en TS (sin dependencias de UI):
  │    itinerario/   → generador, búsqueda local, reordenamiento por clima
  │    presupuesto/  → cálculo, ajuste a monto fijo, meta de ahorro
  │    clima/        → clasificación de días, mezcla pronóstico/promedio
  │    insignias/    → reglas de desbloqueo (reflejo de las del servidor, para mostrar progreso)
  │    geo/          → distancia (haversine), regla de verificación
  ├─ Servicios:
  │    supabase      → auth, viajes, RPC de check-in, lectura de insignias
  │    clima         → Open-Meteo (forecast) + promedios del seed
  └─ Caché offline (IndexedDB vía TanStack Query persister)

[Supabase]  Postgres + RLS + Auth + RPC registrar_checkin + trigger de insignias
[Open-Meteo] api.open-meteo.com/v1/forecast
```

Principios:
- La lógica de negocio vive en `src/domain` como funciones puras y probadas. No leen
  la red ni la hora del sistema: reciben clima, fecha actual y catálogo como parámetros.
- Toda respuesta externa pasa por un esquema Zod. Si falla la validación o la red, el
  servicio devuelve un resultado tipado `{ ok: false, error }` y la UI muestra un estado
  de respaldo, nunca una pantalla rota.
- El catálogo (municipios, atracciones, rutas de bus, tarifas, clima mensual) es de solo
  lectura y se carga desde Supabase con caché larga.
- Lo que otorga valor al usuario (verificación de check-in, insignias) se decide en el
  servidor. El cliente solo muestra.

---

## 5. Modelo de datos (borrador)

### 5.1 Catálogo (lectura pública)
- `departamentos` (id PK, nombre, codigo_dane UNIQUE).
- `nodos` (id PK, tipo: municipio|externo, nombre, lat, lon). Unifica municipios y orígenes externos para que traslados y viajes tengan una sola clave foránea.
- `municipios` (id PK = nodos.id, departamento_id FK, codigo_dane UNIQUE, altitud_m, es_pueblo_patrimonio, radio_checkin_m)
- `origenes_externos` (id PK = nodos.id) para Bogotá, Medellín y Cali (supuesto 1.2.1).
- `atracciones` (id PK, municipio_id FK, nombre, categoria, lat, lon, altitud_m, es_casco_urbano: bool, costo_entrada_cop, tarifa_extranjero_cop?, costo_actividad_cop?, costo_aproximado: bool, duracion_min, minutos_desde_casco, transporte_local_cop, horario_apertura, horario_cierre, dias_cerrado[] (0–6), al_aire_libre: bool, estilos[]: aventura|naturaleza|cultura_cafetera|descanso|gastronomia, requiere_guia: bool, estado_acceso: abierta|restringida|cerrada, nota_acceso?, radio_checkin_m, descripcion, fecha_actualizacion, fuente)
- `rutas_bus` (id PK, nodo_origen FK, nodo_destino FK, minutos, distancia_km, tarifa_cop, frecuencia_diaria, empresa, fecha_actualizacion, fuente; UNIQUE (nodo_origen, nodo_destino)). Solo tramos directos reales.
- `tarifas_referencia` (id PK, concepto: alojamiento|comida, nivel: economico|medio|alto, municipio_id FK?, valor_cop, unidad: persona_noche|persona_dia, fecha_actualizacion, fuente; UNIQUE (concepto, nivel, municipio_id)). Si no hay tarifa para el municipio, se usa la regional (`municipio_id` nulo).
- `clima_mensual` (municipio_id FK, mes CHECK 1–12, precip_mm, dias_lluvia, prob_lluvia, temp_min, temp_max, temporada_relativa: menos_lluviosa|mas_lluviosa; PK (municipio_id, mes))
- `rutas_tematicas` (id PK, clave_texto, fuente) y `ruta_items` (ruta_id FK, municipio_id FK?, atraccion_id FK?; CHECK `num_nonnulls(municipio_id, atraccion_id) = 1`)
- `insignias` (id PK, tipo: municipio|atraccion|departamento|eje|ruta, municipio_id?, atraccion_id?, departamento_id?, ruta_id?, clave_texto, icono; CHECK que exija la referencia correcta según el tipo)

### 5.2 Datos de usuario
- `perfiles` (id PK = auth.users.id ON DELETE CASCADE, nombre, avatar_url, consentimiento_datos_en?, creado_en). Nombre y avatar vienen de la cuenta de Google.
- `viajes` (id PK, usuario_id FK, titulo, fecha_inicio, fecha_fin CHECK ≥ fecha_inicio, origen_nodo_id FK, incluye_regreso: bool, viajeros CHECK ≥ 1, estilos[], nivel, municipios_ids[], atracciones_obligatorias_ids[], limite_jornada_min, umbral_lluvia jsonb, version_catalogo, modo_presupuesto: fijo|sonado, presupuesto_cop?, estado: borrador|planeado|en_curso|terminado)
- `viaje_dias` (viaje_id FK, dia, municipio_base_id FK, nivel_alojamiento, nivel_comida; PK (viaje_id, dia))
- `viaje_items` (id PK, viaje_id FK, dia, orden, atraccion_id FK?, tipo: actividad|traslado|alojamiento|comida|libre, hora_inicio, duracion_min, costo_estimado_cop, fijado: bool, notas; UNIQUE (viaje_id, dia, orden))
- `metas_ahorro` (viaje_id PK FK, monto_objetivo_cop, frecuencia: semanal|mensual, creada_en). La cuota no se guarda: se calcula (sección 6.2).
- `aportes_ahorro` (id PK, viaje_id FK, fecha, monto_cop CHECK > 0)
- `checkins` (id PK, id_cliente uuid UNIQUE, usuario_id FK, atraccion_id FK?, municipio_id FK, recibido_en default now(), verificado: bool, distancia_m?, precision_m?). No se guardan lat ni lon del usuario. `id_cliente` evita duplicados cuando la app reintenta un envío fallido.
- `insignias_usuario` (usuario_id FK, insignia_id FK, obtenida_en, verificada: bool; PK (usuario_id, insignia_id)). `verificada` solo pasa de false a true, nunca al revés.

Todas las tablas de usuario referencian `auth.users` (directa o indirectamente) con
`ON DELETE CASCADE`, para que "Eliminar cuenta" borre todo.

### 5.3 Seguridad (RLS)
- Todas las tablas tienen `ENABLE ROW LEVEL SECURITY`.
- Catálogo: solo una política `FOR SELECT TO anon, authenticated USING (true)`. Ninguna
  política de escritura.
- `viajes`, `perfiles`: el usuario lee y escribe sus filas (`usuario_id = auth.uid()`).
- `viaje_dias`, `viaje_items`, `metas_ahorro`, `aportes_ahorro`: política con
  `EXISTS (SELECT 1 FROM viajes WHERE id = viaje_id AND usuario_id = auth.uid())`.
- `checkins`: solo SELECT del usuario. La inserción se hace únicamente con la RPC
  `registrar_checkin` (sección 6.4).
- `insignias_usuario`: solo SELECT del usuario. Las escribe un trigger del servidor.
- El seed se carga con `scripts/cargar-seed.ts` usando la clave secreta de Supabase,
  leída de una variable sin prefijo `VITE_`. Esa clave nunca entra al bundle del cliente.

### 5.4 Notas
- Los montos se guardan como enteros en COP.
- Las fechas de viaje se manejan en zona horaria `America/Bogota`.
- Los nombres propios del catálogo (municipios, atracciones) y sus descripciones se
  guardan en español como texto plano. Los textos de interfaz viven en
  `src/i18n/es-CO.ts`; `clave_texto` en rutas e insignias apunta a ese archivo.

---

## 6. Lógica clave

### 6.0 Formulación del problema

El generador resuelve una variante del *Team Orienteering Problem with Time Windows*
(TOPTW): cada día es un "equipo" que visita atracciones con horario, desde un municipio
base, sin pasar el límite de jornada.

- **Entrada:** catálogo, grafo de buses, origen, fechas, viajeros, estilos, nivel,
  municipios y atracciones elegidos, límite de jornada, presupuesto (modo fijo) y clima
  por día (`ClimaDia[]`, recibido como parámetro).
- **Decisión:** municipio base por día y asignación de atracciones a (día, orden).
- **Objetivo:** maximizar `Σ puntuación(a) − λ · minutos_de_traslado − μ · penalización_lluvia`,
  donde `puntuación(a)` mide la coincidencia de estilos y `penalización_lluvia` cuenta
  actividades al aire libre en días lluviosos. λ y μ son configurables.
- **Restricciones duras:** límite de jornada, horarios y días de cierre, presupuesto
  (modo fijo), atracciones obligatorias incluidas, actividades del día dentro del
  municipio base o alcanzables desde él, atracciones con `estado_acceso = cerrada` excluidas.
- **Algoritmo:** construcción voraz (pasos 1–6 de 6.1) seguida de búsqueda local por
  ascenso de colina con movimientos de intercambio y 2-opt dentro de cada día, con un
  número máximo de iteraciones. Sin aleatoriedad, o con semilla fija.
- **Determinismo:** desempate siempre por (puntuación desc, costo asc, id asc).
  Misma entrada, mismo clima y misma `version_catalogo` producen el mismo itinerario.
- **Evaluación (entregable académico):** 20–30 instancias de prueba versionadas en
  `src/domain/itinerario/instancias/`. Se compara la construcción voraz sola frente a
  voraz + búsqueda local, y ambas frente al óptimo por fuerza bruta en instancias
  pequeñas (≤ 8 atracciones). Métricas: brecha de optimalidad, violaciones de
  restricciones (deben ser 0), % del presupuesto usado y tiempo de ejecución.

### 6.1 Generador de itinerario (reglas)
1. Filtrar atracciones por municipios elegidos, estilos, `estado_acceso` y días de
   cierre en las fechas del viaje; puntuar por coincidencia de estilo. Las atracciones
   que el usuario eligió a mano quedan como obligatorias.
2. Partir del origen elegido. El día 1 empieza con el bus desde el origen. Si origen y
   primer municipio base son el mismo, no hay traslado y su costo es 0.
3. Elegir municipios base para dormir minimizando minutos de bus. Los traslados se
   calculan con Dijkstra sobre `rutas_bus`, con una penalización de 30 min por
   trasbordo. Si un municipio elegido no tiene camino, se marca como inalcanzable y se
   informa; nunca se inventa un tramo.
4. Repartir atracciones por día respetando el límite de jornada (por defecto 9 h entre
   actividades y traslados) y los horarios, agrupando por cercanía (vecino más cercano
   con el desempate de 6.0). El tiempo de cada atracción incluye ida y vuelta desde el
   casco (`2 × minutos_desde_casco`).
5. Insertar traslados en bus con tiempo y tarifa del camino, más el transporte local
   por atracción. Si `incluye_regreso`, el último día termina con el bus de vuelta.
   - Si el traslado de llegada o de regreso supera por sí solo el límite de jornada,
     ese día contiene solo el traslado, queda exento del límite y se muestra un aviso.
   - Si `fecha_inicio = fecha_fin`, el origen es externo e `incluye_regreso` es
     verdadero, el viaje es infactible y se informa.
6. Calcular costos con las fórmulas de 6.2 e insertar ítems de alojamiento y comida,
   para que los costos queden guardados y no cambien al editar.
7. Búsqueda local de 6.0.
8. Pasada de presupuesto (modo fijo), en este orden y parando apenas `total ≤ monto`:
   1. Bajar el nivel de alojamiento un escalón para todo el viaje y recalcular.
   2. Bajar el nivel de comida un escalón y recalcular. Repetir 1 y 2 hasta el nivel económico.
   3. Quitar actividades no obligatorias en orden ascendente de
      `puntuación / max(costo, 1)`, con desempate por id.
   4. Si aun así no alcanza, devolver `{ ok: false, minimo_cop }` (sección 6.2).
9. Pasada de clima (fase d): permutar actividades entre días con el mismo municipio base
   para poner las de aire libre en días secos y las bajo techo en días lluviosos. Nunca
   mueve ítems con `fijado = true`. Si la permutación cambia el costo, se vuelve a
   ejecutar el paso 8. Se muestra como vista previa antes de aplicar.

Las ediciones manuales del usuario marcan el ítem como `fijado`. Regenerar respeta los
ítems fijados.

### 6.2 Presupuesto
- Desglose: transporte (bus + local), alojamiento, comida, entradas y actividades
  guiadas (`costo_actividad_cop`). Total y por persona.
- Fórmulas:
  - `días = fecha_fin − fecha_inicio + 1`.
  - `noches = días − 1` si `incluye_regreso`; si no, `noches = días`. Un viaje de 1 día
    con regreso tiene 0 noches.
  - Alojamiento: `Σ por noche de tarifa(persona_noche, municipio_base, nivel) × viajeros`.
  - Comida: `tarifa(persona_dia, municipio_base, nivel) × viajeros × días`.
  - Entradas y actividades: `(costo_entrada_cop + costo_actividad_cop) × viajeros`.
    Se usa la tarifa nacional; la de extranjeros se muestra como nota.
  - Bus: `tarifa del camino × viajeros`. Transporte local: `transporte_local_cop × viajeros`
    por atracción.
- Modo fijo: si existe un itinerario factible con `total ≤ monto`, el resultado cumple
  esa condición. Si no existe (traslados + alojamiento + comida al nivel económico, sin
  actividades, ya superan el monto), se devuelve `{ ok: false, minimo_cop }`, no se
  guarda como ajustado y se sugiere acortar el viaje o cambiar de nivel.
- Modo soñado:
  - `meta = metas_ahorro.monto_objetivo_cop`. Se toma del total al crear la meta y solo
    se actualiza cuando el usuario lo pide, si el itinerario cambia.
  - `periodos` = semanas o meses completos entre hoy y `fecha_inicio`.
  - `cuota = max(0, ceil((meta − ahorrado) / max(1, periodos)))`.
  - Si `fecha_inicio ≤ hoy`, no hay cuota y se muestra "meta vencida". Si
    `ahorrado ≥ meta`, se muestra "meta cumplida".
  - Barra de progreso con los aportes registrados.
- Formato con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`, centralizado en `src/lib`.

### 6.3 Clima
- Si algún día del viaje está dentro de los próximos 16 días: Open-Meteo forecast con
  `forecast_days=16` explícito (el valor por defecto es 7),
  `daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min`
  y `timezone=America/Bogota`. Varios lugares se piden en una sola llamada (lat y lon
  separados por comas). Los días 8–16 se etiquetan como "tendencia"; los que pasen el
  horizonte usan el promedio. Fuente: [documentación de Open-Meteo](https://open-meteo.com/en/docs).
- Si no: `clima_mensual` del seed, asignando el mes día por día (un viaje que cruza dos
  meses usa el promedio de cada uno), con la etiqueta visible "Estimación según
  promedios históricos, no es un pronóstico".
- Atracciones al aire libre extensas o a mucha más altura que el casco (p. ej. Cocora,
  PNN Los Nevados) se consultan con su propio lat/lon y el parámetro `elevation`.
  Limitación documentada: la resolución de los modelos (varios km) es gruesa para
  terreno de montaña.
- Día lluvioso:
  - Pronóstico: probabilidad ≥ 60 % o precipitación ≥ 5 mm.
  - Promedio: `prob_lluvia = dias_lluvia / días_del_mes` (día de lluvia = ≥ 1 mm) ≥ 60 %.
  - Umbrales configurables y guardados en el viaje.
- Los promedios mensuales se generan una vez con un script que consulta la API
  histórica de Open-Meteo. Para no pasar la cuota gratuita (10.000 llamadas al día; una
  petición larga cuenta como varias, ver [precios](https://open-meteo.com/en/pricing)):
  5 años, solo las variables necesarias, pausas entre peticiones, resultados parciales
  guardados y ejecución reanudable.
- `temporada_relativa` es "menos lluviosa" o "más lluviosa": el régimen de la región es
  bimodal y húmedo todo el año, así que no se etiqueta como "seca".
- Atribución visible: "Weather data by Open-Meteo.com" (CC BY 4.0).

### 6.4 Check-in e insignias
- El check-in requiere conexión. El cliente pide una posición nueva
  (`getCurrentPosition` con `maximumAge: 0`) y llama a la RPC
  `registrar_checkin(lugar_id, lat, lon, precision_m, id_cliente)`
  (`SECURITY DEFINER`). La RPC:
  1. Calcula la distancia haversine en el servidor.
  2. Fija `verificado` con la regla de abajo.
  3. Guarda `distancia_m` y `precision_m` y descarta lat y lon. La fecha del check-in
     es la del servidor (`recibido_en`).
  4. Ignora reenvíos con el mismo `id_cliente` (reintentos tras un fallo de red).
- Sin conexión, el botón de check-in se desactiva y muestra el motivo.
- Un trigger sobre `checkins` otorga o actualiza `insignias_usuario`. El cliente nunca
  escribe `verificado` ni insignias.
- Radio por defecto: 300 m para atracciones puntuales, 1–2 km para atracciones extensas
  (p. ej. Valle de Cocora) y para el casco urbano de un municipio. Configurable por
  atracción y por municipio.
- Regla de verificación: `distancia + precision ≤ radio`. Con precisión peor que el
  radio nunca se verifica; se ofrece el registro manual. La misma función existe en
  `src/domain/geo` para mostrar la vista previa y se prueba con casos límite.
- El registro manual crea el check-in con `verificado = false`; la insignia se muestra distinta.
- Insignias especiales: todos los municipios de cada departamento (Caldas, Quindío,
  Risaralda), "Eje Cafetero" por los 53 municipios de los tres departamentos (supuesto
  1.2.4) y cada ruta temática completa (ruta del café, termales y pueblos patrimonio).
- Regla de las insignias especiales, con `n` componentes:
  - Se otorga cuando los `n` componentes tienen check-in, verificado o manual.
  - Es verificada si al menos `ceil(0,8 × n)` componentes tienen check-in verificado.
    Ejemplos: Quindío (12) exige 10 verificados; Eje Cafetero (53) exige 43; Pueblos
    patrimonio (2) exige los 2.
  - Si no llega al 80 %, se otorga como no verificada y pasa a verificada cuando lo alcanza.
- Limitación aceptada: el GPS se puede falsear con herramientas de desarrollo o apps de
  ubicación simulada, y una PWA no lo puede detectar.
- Privacidad: antes del primer check-in se muestra la política de tratamiento de datos
  (Ley 1581 de 2012 y Decreto 1377 de 2013) y se pide consentimiento explícito, que se
  guarda en `perfiles.consentimiento_datos_en`. La política menciona la transferencia
  internacional (Supabase y Google alojan datos fuera de Colombia).

### 6.5 Mapa y uso offline
- La [política de teselas de OSM](https://operations.osmfoundation.org/policies/tiles/)
  prohíbe la descarga masiva, la precarga y el uso offline de `tile.openstreetmap.org`.
- Workbox solo cachea en tiempo de ejecución las teselas ya vistas (CacheFirst, máximo
  unas 500 entradas, TTL ≥ 7 días), sin botón de descarga.
- Sin conexión, el itinerario se muestra como lista; el mapa base puede no aparecer.
- Cabecera `Referrer-Policy: strict-origin-when-cross-origin` en el despliegue (la
  política de OSM exige referer válido) y atribución visible "© OpenStreetMap contributors".

---

## 7. Datos semilla

- Municipios: Caldas 27, Quindío 12, Risaralda 14 (53). Antes de crear el seed se
  confirman contra la [DIVIPOLA del DANE](https://geoportal.dane.gov.co) y se guardan
  los códigos DANE.
- Coordenadas: casco urbano de cada municipio (DANE u OpenStreetMap).
- Atracciones: 40–60 iniciales, las principales de cada departamento (p. ej. Valle de
  Cocora, Parque del Café, Termales de Santa Rosa, Nevado del Ruiz / PNN Los Nevados,
  Recinto del Pensamiento, Jardín Botánico del Quindío, fincas cafeteras con recorrido).
  Para cada una: horarios, días de cierre, tiempo y costo desde el casco, tarifa nacional
  y de extranjeros si difieren, y nota de temporada.
- Accesos restringidos: el PNN Los Nevados y el Nevado del Ruiz dependen del nivel de
  alerta del [Servicio Geológico Colombiano](https://www.sgc.gov.co) y de
  [Parques Nacionales](https://www.parquesnacionales.gov.co), y requieren guía u
  operador. Se marcan con `requiere_guia` y `estado_acceso`, y se revisan antes de cada
  entrega.
- Cada municipio tiene una pseudoatracción "Casco urbano" (`es_casco_urbano = true`,
  costo 0), que el generador puede usar como visita y que permite ganar la insignia del
  municipio aunque no tenga otras atracciones.
- Rutas de bus: solo tramos directos reales, con hubs en Manizales, Pereira y Armenia,
  más los orígenes externos (Bogotá, Medellín, Cali). Estimación: 120–200 tramos, frente
  a unos 3.100 pares ordenados de una matriz completa entre 56 nodos. Tarifas
  aproximadas con fecha y fuente (terminales de transporte o empresas de bus).
- Tarifas de alojamiento y comida: valor regional por nivel, más valores por municipio
  en los destinos donde difieren (p. ej. Salento, Filandia).
- Cada costo lleva `costo_aproximado = true`, `fecha_actualizacion` y `fuente`.
- Rutas temáticas: pueblos patrimonio (Salamina y Aguadas, verificada con la Red
  Turística de Pueblos Patrimonio); ruta del café y ruta de termales armadas con
  atracciones del seed, cada una con su fuente (decisión del 9 de noviembre de 2026:
  no hay una lista oficial para estas dos, ver `supabase/seed/FUENTES.md`).
- Formato: archivos JSON/CSV en `supabase/seed/` + script de carga, validados con Zod.

---

## 8. Estructura de carpetas

```
/
├─ plan.md
├─ README.md
├─ supabase/
│  ├─ migrations/          # SQL: tablas, índices, RLS, RPC registrar_checkin, trigger de insignias
│  ├─ tests/               # pruebas de políticas RLS y de la RPC
│  └─ seed/                # municipios.json, atracciones.json, rutas_bus.csv, tarifas.json, clima_mensual.json
├─ scripts/
│  ├─ generar-clima-mensual.ts   # reanudable, respeta la cuota de Open-Meteo
│  └─ cargar-seed.ts             # usa la clave secreta (variable sin prefijo VITE_)
├─ .github/workflows/      # CI (lint, tests) y consulta diaria para evitar la pausa de Supabase
└─ src/
   ├─ app/                 # router, providers, layout
   ├─ domain/              # lógica pura + tests
   │  ├─ itinerario/
   │  │  └─ instancias/    # instancias de prueba para la evaluación (6.0)
   │  ├─ presupuesto/
   │  ├─ clima/
   │  ├─ insignias/
   │  └─ geo/
   ├─ services/            # supabase.ts, openMeteo.ts (con esquemas Zod)
   ├─ features/
   │  ├─ catalogo/         # lista, ficha, mapa
   │  ├─ planificador/
   │  ├─ presupuesto/
   │  ├─ clima/
   │  ├─ insignias/
   │  ├─ privacidad/       # política de datos, consentimiento, eliminar cuenta
   │  └─ auth/
   ├─ components/          # UI compartida
   ├─ i18n/
   │  └─ es-CO.ts          # todos los textos de interfaz (objeto tipado) y función t(clave)
   ├─ lib/                 # formato COP, fechas, errores (locale es-CO)
   └─ types/
```

---

## 9. Fases de construcción

Cada fase termina con: qué se hizo, cómo probarlo y qué sigue.

### Fase 0: Preparación
- Decisiones tomadas (secciones 1.1, 1.2 y 1.3).
- Crear proyecto Vite, Tailwind, ESLint/Prettier, Vitest, proyecto Supabase y variables de entorno (`.env.example`, sin secretos en el repo).
- Inicio de sesión con Google:
  - En Google Cloud Console, crear el cliente OAuth con URI de redirección autorizada `https://<ref>.supabase.co/auth/v1/callback`.
  - En Supabase, configurar el proveedor Google y agregar en *Redirect URLs* las URL de la app (local, producción y comodín para previews).
  - Publicar la pantalla de consentimiento o agregar como usuarios de prueba a quienes vayan a evaluar el proyecto (en modo *Testing* solo entran usuarios de prueba).
- Crear `src/i18n/es-CO.ts` y la función `t(clave)`; los componentes no llevan textos de interfaz escritos directamente.
- Redactar la política de tratamiento de datos.
- Workflow diario que haga una consulta real a Supabase, porque el plan gratuito pausa proyectos con poca actividad en 7 días y la documentación recomienda algunas consultas al día ([documentación](https://supabase.com/docs/guides/platform/pausing); decisión del 9 de noviembre de 2026).
- **Aceptación:** la app arranca, se puede iniciar y cerrar sesión con Google, CI corre lint y tests, los textos de la pantalla inicial salen de `es-CO.ts`, `.env.example` no contiene la clave secreta.

### Fase (a): Catálogo + mapa
- Verificar conteo de municipios (DIVIPOLA), construir seed y migraciones con RLS.
- Lista filtrable de municipios y atracciones (departamento, categoría, aire libre/bajo techo, estilo).
- Ficha de atracción con costo aproximado, duración, horario, estado de acceso y fecha de actualización.
- Mapa Leaflet con marcadores agrupados, atribución OSM y caché de teselas según 6.5.
- **Aceptación:** los 53 municipios aparecen en el mapa; Salamina y Aguadas aparecen como pueblos patrimonio; los filtros funcionan en móvil; el seed pasa la validación Zod; un INSERT con la clave pública sobre `atracciones` falla; el grafo de buses conecta todos los municipios con cabecera alcanzable por carretera, y los que no, quedan listados.

### Fase (b): Planificador de itinerarios
- Formulario: origen, fechas, municipios/atracciones, viajeros, estilos, nivel.
- Generador de la sección 6.1 (pasos 1–7) con pruebas unitarias, incluidos los casos de 1 día, origen igual a destino, municipio inalcanzable y traslado largo desde Bogotá.
- Evaluación de 6.0 con las instancias de prueba y un informe de resultados.
- Vista día por día con traslados en bus y costos; editar, reordenar con botones "subir" y "bajar", agregar y quitar; los ítems editados quedan fijados.
- Guardar y listar viajes del usuario; lectura offline; itinerarios sin cuenta en IndexedDB.
- **Aceptación:** misma entrada y mismo clima producen el mismo itinerario; el día 1 parte del origen elegido; ningún día supera el límite de jornada salvo los días de solo traslado marcados; 0 violaciones de restricciones en las instancias de prueba; generación en < 500 ms en un móvil de gama media; cobertura ≥ 80 % en `domain/itinerario`; los cambios persisten tras recargar.

### Fase (c): Presupuesto
- Desglose por categoría, total y por persona, con las fórmulas de 6.2.
- Modo fijo con ajuste automático (paso 8 de 6.1) y mensaje con el mínimo cuando no alcanza.
- Modo soñado con meta semanal/mensual, registro de aportes y barra de progreso.
- **Aceptación:** cuando existe un itinerario factible, el ajustado nunca supera el monto fijo; cuando no existe, se muestra el mínimo y no se guarda como ajustado; las atracciones obligatorias nunca se quitan; la cuota se recalcula al registrar aportes y no es negativa ni divide por cero; pruebas unitarias de los cálculos, incluidos 0 noches, meta vencida y meta cumplida.

### Fase (d): Clima
- Servicio Open-Meteo con Zod, caché y respaldo a promedios.
- Script y seed de `clima_mensual`.
- Indicador por día (pronóstico, tendencia o estimación) y botón "Reorganizar por clima" con vista previa de cambios.
- **Aceptación:** con la red cortada la app muestra la estimación con aviso; fechas a más de 16 días nunca se etiquetan como pronóstico; un viaje que cruza dos meses usa el promedio de cada mes; la reorganización no mueve actividades fuera de su municipio base ni mueve ítems fijados; la atribución de Open-Meteo es visible; pruebas unitarias de `domain/clima`.

### Fase (e): Insignias y perfil
- Consentimiento de datos antes del primer check-in.
- RPC `registrar_checkin` y trigger de insignias (sección 6.4); registro manual no verificado.
- Check-in desactivado sin conexión, con mensaje.
- Reglas de insignias especiales.
- Perfil: mapa con municipios desbloqueados, progreso por departamento y por ruta, opción "Eliminar cuenta y datos".
- **Aceptación:** un check-in fuera del radio no se verifica; un INSERT directo en `checkins` o `insignias_usuario` con la clave pública falla; reenviar el mismo check-in no crea duplicados; completar los municipios de un departamento otorga su insignia; una insignia especial con al menos el 80 % de componentes verificados se marca verificada y con menos se marca no verificada (pruebas con 79 % y 80 %); las insignias manuales se distinguen visualmente; eliminar la cuenta borra viajes, check-ins e insignias; pruebas unitarias de `domain/geo` con casos límite de radio y precisión.

### Fase final: Pulido
- Accesibilidad (contraste, foco, etiquetas), rendimiento en móvil, textos en español revisados.
- Una prueba end-to-end en Playwright del flujo principal: crear viaje → ajustar presupuesto → ver clima → check-in (con `context.setGeolocation`).
- Despliegue con `Referrer-Policy` correcta y verificación de que Supabase no está pausado antes de la sustentación.

---

## 10. Preguntas abiertas

Las 9 preguntas iniciales (sección 1.1) y los supuestos (sección 1.2) quedaron
confirmados, y los recortes de la sección 1.3 están aplicados. No quedan preguntas
abiertas.

---

## Anexo A: Prompt revisado

> Actúa como un ingeniero de software senior y diseñador de producto. Vamos a construir
> juntos una aplicación web responsive, pensada primero para móvil e instalable como PWA,
> de planificación de viajes para el Eje Cafetero de Colombia: Caldas, Quindío y
> Risaralda. Proyecto académico para un curso de Sistemas Inteligentes.
>
> **Objetivo del producto.** Ayudar a los viajeros a planificar un viaje por el Eje
> Cafetero según un rango de fechas y un presupuesto, teniendo en cuenta el clima, y
> motivarlos a explorar la región con un sistema de insignias.
>
> **Fuera del alcance del MVP.** Municipios del Valle del Cauca del Paisaje Cultural
> Cafetero (versión posterior), otros idiomas, reservas, pagos, reseñas de usuarios,
> itinerarios colaborativos, panel de administración y mapa base sin conexión.
>
> **1. Planificador de viajes (núcleo).**
> - El usuario elige el punto de partida, fecha de inicio y fin, municipios o atracciones
>   de interés, número de viajeros, estilo de viaje (aventura, naturaleza, cultura
>   cafetera, descanso, gastronomía) y nivel de gasto (económico, medio, alto).
> - La app genera un itinerario día por día con un algoritmo determinista (sin IA
>   generativa), formulado como problema de optimización con función objetivo y
>   restricciones explícitas: actividades con horarios, rutas de bus intermunicipal
>   directas con tiempo y tarifa, y costos estimados (tarifas de referencia con fecha de
>   actualización). Límite de jornada configurable. El algoritmo se evalúa con instancias
>   de prueba contra una línea base.
> - El usuario puede editar, reordenar (botones accesibles "subir" y "bajar"), guardar
>   y consultar el itinerario sin conexión.
>
> **2. Presupuesto con dos modos.** El monto es el total del grupo; se muestra también
> por persona.
> - "Presupuesto fijo": el usuario ingresa un monto en COP y la app ajusta el itinerario
>   para no superarlo (primero baja el nivel de alojamiento y comida, luego quita las
>   actividades no obligatorias con peor relación puntuación/costo), desglosando
>   transporte, alojamiento, comida, entradas y actividades. Si no alcanza ni con el
>   mínimo, lo informa y muestra el mínimo estimado.
> - "Viaje soñado": sin límite inicial. La app calcula el costo total y ofrece una meta
>   de ahorro semanal o mensual hasta la fecha del viaje. El usuario registra sus aportes
>   manualmente y ve su progreso.
>
> **3. Clima.**
> - Para fechas dentro de los próximos 16 días, usa el pronóstico diario de Open-Meteo
>   (sin API key) con las coordenadas del municipio o de la atracción y zona horaria
>   America/Bogota.
> - Para fechas más lejanas, o si la API falla, usa promedios históricos mensuales
>   precalculados e indica claramente que es una estimación, no un pronóstico.
> - Define un día lluvioso con un umbral configurable. Si se espera lluvia, sugiere
>   reorganizar: actividades al aire libre (Valle de Cocora, termales, senderismo) en días
>   secos y bajo techo (museos, fincas cafeteras con recorrido cubierto) en días lluviosos,
>   con vista previa antes de aplicar.
>
> **4. Insignias.**
> - Insignia por cada municipio y cada atracción visitada.
> - Insignias especiales: todos los municipios de un departamento, todo el Eje Cafetero
>   y rutas temáticas (ruta del café, termales y pueblos patrimonio con Salamina y
>   Aguadas) con listas verificadas en fuentes oficiales. Una insignia especial es
>   verificada si al menos el 80 % de sus componentes tienen check-in verificado.
> - Validación por geolocalización en el servidor, con radio configurable por lugar y
>   regla de precisión GPS; no se guardan las coordenadas del usuario. Opción de registro
>   manual marcado como "no verificado". El check-in requiere conexión.
> - Perfil con mapa de la región, municipios desbloqueados y progreso por departamento
>   y por ruta.
>
> **Datos.**
> - Seed de municipios con código DANE y coordenadas. Verifica el conteo contra la
>   DIVIPOLA del DANE antes de crearlo (referencia esperada: Caldas 27, Quindío 12,
>   Risaralda 14).
> - Seed de 40–60 atracciones principales con categoría, costo aproximado de entrada,
>   duración sugerida, horario, aire libre o bajo techo, estilos asociados, estado de
>   acceso, radio de check-in, fuente y fecha de actualización.
> - Rutas de bus directas entre municipios, tarifas de referencia y clima mensual, todo
>   con fecha de actualización y fuente.
>
> **Requisitos técnicos.**
> - Stack: React + TypeScript + Vite, Tailwind, TanStack Query, Zod,
>   Supabase (Postgres, Auth, RLS), Leaflet con OpenStreetMap, PWA.
> - Inicio de sesión con Google para guardar viajes e insignias.
> - Interfaz en español (es-CO) con todos los textos en un único archivo tipado;
>   moneda COP sin decimales con `Intl`.
> - Código tipado y organizado; lógica de negocio en funciones puras con pruebas
>   unitarias; respuestas externas validadas; estados de respaldo cuando fallen las APIs.
> - RLS en todas las tablas; lo que otorga insignias se decide en el servidor.
> - Política de tratamiento de datos (Ley 1581 de 2012) y opción de eliminar la cuenta.
> - Atribución de OpenStreetMap y Open-Meteo. Secretos solo en variables de entorno.
>
> **Cómo quiero que trabajemos.**
> 1. Primero, hazme las preguntas necesarias para aclarar requisitos ambiguos.
> 2. Luego propón arquitectura, modelo de datos y estructura de carpetas, y espera mi
>    aprobación.
> 3. Construye por fases, cada una con criterios de aceptación medibles:
>    a) Catálogo de municipios y atracciones + mapa
>    b) Planificador de itinerarios
>    c) Presupuesto (ambos modos)
>    d) Integración del clima
>    e) Insignias y perfil
> 4. Al terminar cada fase, explica qué hiciste, cómo probarlo y qué sigue.
