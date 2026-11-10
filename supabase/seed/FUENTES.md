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
- Queda pendiente la decisión del usuario sobre cómo definir esta ruta.

## Ruta de termales: sin fuente oficial con lista definida

- No se encontró una ruta de termales oficial. Los termales son atracciones
  privadas (p. ej. en Santa Rosa de Cabal, Manizales y Villamaría), así que la
  ruta tendría que definirse con las atracciones del seed (T-08).
- Queda pendiente la decisión del usuario.
