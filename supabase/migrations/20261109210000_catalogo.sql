-- T-07: tablas del catálogo (plan.md 5.1) con RLS de solo lectura (plan.md 5.3).
-- El catálogo lo carga scripts/cargar-seed.ts con la clave secreta, que salta RLS.
-- Con las claves anon y authenticated solo se puede leer.
--
-- Convenciones:
-- - Los id son textos estables en minúsculas (p. ej. 'salento', 'valle-de-cocora')
--   para que el seed sea legible y el desempate por id del generador sea estable.
-- - Montos en COP como enteros (plan.md 5.4).
-- - Los valores cerrados (tipo, categoría de nivel, estado) se validan con CHECK.

-- ------------------------------------------------------------ departamentos

create table public.departamentos (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  nombre text not null check (nombre <> ''),
  codigo_dane text not null unique check (codigo_dane ~ '^[0-9]{2}$')
);

-- ------------------------------------------------------------ nodos del grafo de buses
-- Unifica municipios y orígenes externos para que rutas y viajes tengan una sola FK.

create table public.nodos (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  tipo text not null check (tipo in ('municipio', 'externo')),
  nombre text not null check (nombre <> ''),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  -- Permite que municipios y origenes_externos exijan el tipo correcto en su FK.
  unique (id, tipo)
);

create table public.municipios (
  id text primary key,
  tipo text not null default 'municipio' check (tipo = 'municipio'),
  departamento_id text not null references public.departamentos (id),
  codigo_dane text not null unique check (codigo_dane ~ '^[0-9]{5}$'),
  altitud_m integer check (altitud_m between 0 and 6000),
  es_pueblo_patrimonio boolean not null default false,
  -- Radio del check-in en el casco urbano (plan.md 6.4: 1 a 2 km).
  radio_checkin_m integer not null default 1500 check (radio_checkin_m between 50 and 5000),
  foreign key (id, tipo) references public.nodos (id, tipo) on delete cascade
);

create index municipios_departamento_idx on public.municipios (departamento_id);

-- Bogotá, Medellín y Cali (plan.md 1.2, supuesto 1).
create table public.origenes_externos (
  id text primary key,
  tipo text not null default 'externo' check (tipo = 'externo'),
  foreign key (id, tipo) references public.nodos (id, tipo) on delete cascade
);

-- ------------------------------------------------------------ atracciones

create table public.atracciones (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  municipio_id text not null references public.municipios (id),
  nombre text not null check (nombre <> ''),
  categoria text not null check (categoria <> ''),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  altitud_m integer check (altitud_m between 0 and 6000),
  es_casco_urbano boolean not null default false,
  costo_entrada_cop integer not null default 0 check (costo_entrada_cop >= 0),
  tarifa_extranjero_cop integer check (tarifa_extranjero_cop >= 0),
  costo_actividad_cop integer check (costo_actividad_cop >= 0),
  costo_aproximado boolean not null default true,
  duracion_min integer not null check (duracion_min > 0),
  minutos_desde_casco integer not null default 0 check (minutos_desde_casco >= 0),
  transporte_local_cop integer not null default 0 check (transporte_local_cop >= 0),
  -- Ambos nulos = sin horario (p. ej. casco urbano).
  horario_apertura time,
  horario_cierre time,
  -- 0 = domingo ... 6 = sábado.
  dias_cerrado smallint[] not null default '{}'
    check (dias_cerrado <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  al_aire_libre boolean not null,
  estilos text[] not null default '{}'
    check (estilos <@ array['aventura', 'naturaleza', 'cultura_cafetera', 'descanso', 'gastronomia']),
  requiere_guia boolean not null default false,
  estado_acceso text not null default 'abierta'
    check (estado_acceso in ('abierta', 'restringida', 'cerrada')),
  nota_acceso text,
  -- plan.md 6.4: 300 m para atracciones puntuales, 1 a 2 km para las extensas.
  radio_checkin_m integer not null default 300 check (radio_checkin_m between 50 and 5000),
  descripcion text not null default '',
  fecha_actualizacion date not null,
  fuente text not null check (fuente <> ''),
  check (
    (horario_apertura is null and horario_cierre is null)
    or (horario_apertura is not null and horario_cierre is not null
        and horario_cierre > horario_apertura)
  ),
  -- La pseudoatracción "Casco urbano" no cobra entrada (plan.md 7).
  check (not es_casco_urbano or (costo_entrada_cop = 0 and minutos_desde_casco = 0))
);

create index atracciones_municipio_idx on public.atracciones (municipio_id);

-- Una sola pseudoatracción "Casco urbano" por municipio.
create unique index atracciones_casco_urbano_uidx
  on public.atracciones (municipio_id) where es_casco_urbano;

-- ------------------------------------------------------------ rutas de bus
-- Solo tramos directos reales (plan.md 7). El grafo se recorre con Dijkstra.

create table public.rutas_bus (
  id bigint generated always as identity primary key,
  nodo_origen text not null references public.nodos (id),
  nodo_destino text not null references public.nodos (id),
  minutos integer not null check (minutos > 0),
  distancia_km numeric(6, 1) check (distancia_km > 0),
  tarifa_cop integer not null check (tarifa_cop >= 0),
  costo_aproximado boolean not null default true,
  frecuencia_diaria integer check (frecuencia_diaria > 0),
  empresa text,
  fecha_actualizacion date not null,
  fuente text not null check (fuente <> ''),
  unique (nodo_origen, nodo_destino),
  check (nodo_origen <> nodo_destino)
);

create index rutas_bus_destino_idx on public.rutas_bus (nodo_destino);

-- ------------------------------------------------------------ tarifas de referencia
-- municipio_id nulo = tarifa regional, que se usa si el municipio no tiene la suya.

create table public.tarifas_referencia (
  id bigint generated always as identity primary key,
  concepto text not null check (concepto in ('alojamiento', 'comida')),
  nivel text not null check (nivel in ('economico', 'medio', 'alto')),
  municipio_id text references public.municipios (id),
  valor_cop integer not null check (valor_cop > 0),
  unidad text not null check (unidad in ('persona_noche', 'persona_dia')),
  costo_aproximado boolean not null default true,
  fecha_actualizacion date not null,
  fuente text not null check (fuente <> ''),
  -- NULLS NOT DISTINCT: solo una tarifa regional por concepto y nivel.
  unique nulls not distinct (concepto, nivel, municipio_id),
  check (
    (concepto = 'alojamiento' and unidad = 'persona_noche')
    or (concepto = 'comida' and unidad = 'persona_dia')
  )
);

create index tarifas_referencia_municipio_idx on public.tarifas_referencia (municipio_id);

-- ------------------------------------------------------------ clima mensual

create table public.clima_mensual (
  municipio_id text not null references public.municipios (id),
  mes smallint not null check (mes between 1 and 12),
  precip_mm numeric(6, 1) not null check (precip_mm >= 0),
  dias_lluvia numeric(4, 1) not null check (dias_lluvia between 0 and 31),
  -- Fracción de 0 a 1: dias_lluvia / días del mes (plan.md 6.3).
  prob_lluvia numeric(4, 3) not null check (prob_lluvia between 0 and 1),
  temp_min numeric(4, 1) not null,
  temp_max numeric(4, 1) not null,
  temporada_relativa text not null
    check (temporada_relativa in ('menos_lluviosa', 'mas_lluviosa')),
  primary key (municipio_id, mes),
  check (temp_max >= temp_min)
);

-- ------------------------------------------------------------ rutas temáticas

create table public.rutas_tematicas (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  -- Clave de src/i18n/es-CO.ts (p. ej. 'rutas.cafe').
  clave_texto text not null unique check (clave_texto ~ '^rutas\.[A-Za-z0-9_]+$'),
  fuente text not null check (fuente <> '')
);

create table public.ruta_items (
  id bigint generated always as identity primary key,
  ruta_id text not null references public.rutas_tematicas (id) on delete cascade,
  municipio_id text references public.municipios (id),
  atraccion_id text references public.atracciones (id),
  check (num_nonnulls(municipio_id, atraccion_id) = 1),
  unique (ruta_id, municipio_id),
  unique (ruta_id, atraccion_id)
);

create index ruta_items_municipio_idx on public.ruta_items (municipio_id);
create index ruta_items_atraccion_idx on public.ruta_items (atraccion_id);

-- ------------------------------------------------------------ insignias

create table public.insignias (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  tipo text not null
    check (tipo in ('municipio', 'atraccion', 'departamento', 'eje', 'ruta')),
  municipio_id text references public.municipios (id),
  atraccion_id text references public.atracciones (id),
  departamento_id text references public.departamentos (id),
  ruta_id text references public.rutas_tematicas (id),
  -- Clave de src/i18n/es-CO.ts (p. ej. 'insignias.ejeCafetero').
  clave_texto text not null check (clave_texto ~ '^insignias\.[A-Za-z0-9_.]+$'),
  icono text not null check (icono <> ''),
  -- Cada tipo exige su referencia y ninguna otra; 'eje' no lleva referencia.
  check (
    case tipo
      when 'municipio' then municipio_id is not null
        and num_nonnulls(atraccion_id, departamento_id, ruta_id) = 0
      when 'atraccion' then atraccion_id is not null
        and num_nonnulls(municipio_id, departamento_id, ruta_id) = 0
      when 'departamento' then departamento_id is not null
        and num_nonnulls(municipio_id, atraccion_id, ruta_id) = 0
      when 'ruta' then ruta_id is not null
        and num_nonnulls(municipio_id, atraccion_id, departamento_id) = 0
      when 'eje' then num_nonnulls(municipio_id, atraccion_id, departamento_id, ruta_id) = 0
    end
  ),
  -- Una insignia por referencia (y una sola 'eje').
  unique nulls not distinct (tipo, municipio_id, atraccion_id, departamento_id, ruta_id)
);

create index insignias_municipio_idx on public.insignias (municipio_id);
create index insignias_atraccion_idx on public.insignias (atraccion_id);
create index insignias_departamento_idx on public.insignias (departamento_id);
create index insignias_ruta_idx on public.insignias (ruta_id);

-- ------------------------------------------------------------ seguridad (plan.md 5.3)
-- RLS en todas las tablas y una única política de lectura. Sin políticas de
-- escritura, RLS rechaza INSERT, UPDATE y DELETE de anon y authenticated. Además
-- se quitan esos privilegios (y TRUNCATE, que RLS no controla).

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'departamentos', 'nodos', 'municipios', 'origenes_externos', 'atracciones',
    'rutas_bus', 'tarifas_referencia', 'clima_mensual', 'rutas_tematicas',
    'ruta_items', 'insignias'
  ]
  loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      tabla || '_lectura_publica', tabla
    );
    execute format(
      'revoke insert, update, delete, truncate on public.%I from anon, authenticated',
      tabla
    );
    execute format('grant select on public.%I to anon, authenticated', tabla);
  end loop;
end
$$;
