-- T-12: tablas de datos de usuario (plan.md 5.2) con RLS por propietario (5.3).
-- NO incluye checkins ni insignias_usuario: esas van en T-19 (con la RPC
-- registrar_checkin y el trigger de insignias).
--
-- Reglas comunes (coherentes con la migración del catálogo, T-07):
-- - Montos en COP como enteros (plan.md 5.4).
-- - Fechas de viaje como `date`; se interpretan en America/Bogota en la app.
-- - Valores cerrados (nivel, modo, estado, tipo de ítem) validados con CHECK.
-- - Todas las tablas cuelgan de auth.users con ON DELETE CASCADE (directa o
--   indirectamente), para que "eliminar cuenta" (T-21) borre todo.
-- - Los estilos reusan el mismo dominio que el catálogo (5 valores).

-- ------------------------------------------------------------ perfiles
-- PK = auth.users.id. Nombre y avatar vienen de la cuenta de Google.

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  avatar_url text,
  -- Fecha del consentimiento de datos (plan.md 6.4); null = aún no lo dio.
  consentimiento_datos_en timestamptz,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------ viajes

create table public.viajes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null check (titulo <> ''),
  fecha_inicio date not null,
  fecha_fin date not null,
  -- Origen: municipio del catálogo u origen externo (ambos son nodos).
  origen_nodo_id text not null references public.nodos (id),
  incluye_regreso boolean not null default true,
  viajeros integer not null check (viajeros >= 1),
  estilos text[] not null default '{}'
    check (estilos <@ array['aventura', 'naturaleza', 'cultura_cafetera', 'descanso', 'gastronomia']),
  nivel text not null check (nivel in ('economico', 'medio', 'alto')),
  -- Municipios y atracciones elegidos por el usuario (ids del catálogo).
  municipios_ids text[] not null default '{}',
  atracciones_obligatorias_ids text[] not null default '{}',
  -- Límite de jornada en minutos (plan.md 6.1: 9 h = 540 por defecto).
  limite_jornada_min integer not null default 540 check (limite_jornada_min > 0),
  -- Umbrales de lluvia configurables (plan.md 6.3); forma libre controlada por la app.
  umbral_lluvia jsonb not null default '{}'::jsonb,
  -- version_catalogo para reproducir el mismo itinerario (plan.md 6.0).
  version_catalogo text,
  modo_presupuesto text not null default 'fijo'
    check (modo_presupuesto in ('fijo', 'sonado')),
  presupuesto_cop integer check (presupuesto_cop >= 0),
  estado text not null default 'borrador'
    check (estado in ('borrador', 'planeado', 'en_curso', 'terminado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);

create index viajes_usuario_idx on public.viajes (usuario_id);

-- ------------------------------------------------------------ viaje_dias
-- Un registro por día del viaje, con el municipio base para dormir (plan.md 5.2).

create table public.viaje_dias (
  viaje_id uuid not null references public.viajes (id) on delete cascade,
  dia integer not null check (dia >= 1),
  municipio_base_id text not null references public.municipios (id),
  nivel_alojamiento text not null check (nivel_alojamiento in ('economico', 'medio', 'alto')),
  nivel_comida text not null check (nivel_comida in ('economico', 'medio', 'alto')),
  primary key (viaje_id, dia)
);

-- ------------------------------------------------------------ viaje_items

create table public.viaje_items (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.viajes (id) on delete cascade,
  dia integer not null check (dia >= 1),
  orden integer not null check (orden >= 1),
  -- Solo las actividades referencian una atracción.
  atraccion_id text references public.atracciones (id),
  tipo text not null
    check (tipo in ('actividad', 'traslado', 'alojamiento', 'comida', 'libre')),
  hora_inicio time,
  duracion_min integer not null default 0 check (duracion_min >= 0),
  costo_estimado_cop integer not null default 0 check (costo_estimado_cop >= 0),
  -- Las ediciones del usuario fijan el ítem; regenerar y el clima lo respetan.
  fijado boolean not null default false,
  notas text,
  unique (viaje_id, dia, orden),
  -- Solo los ítems de tipo 'actividad' llevan atracción.
  check (atraccion_id is null or tipo = 'actividad')
);

create index viaje_items_viaje_idx on public.viaje_items (viaje_id);
create index viaje_items_atraccion_idx on public.viaje_items (atraccion_id);

-- ------------------------------------------------------------ metas_ahorro
-- PK = viaje_id: una meta por viaje. La cuota no se guarda, se calcula (6.2).

create table public.metas_ahorro (
  viaje_id uuid primary key references public.viajes (id) on delete cascade,
  monto_objetivo_cop integer not null check (monto_objetivo_cop > 0),
  frecuencia text not null check (frecuencia in ('semanal', 'mensual')),
  creada_en timestamptz not null default now()
);

-- ------------------------------------------------------------ aportes_ahorro

create table public.aportes_ahorro (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.viajes (id) on delete cascade,
  fecha date not null,
  monto_cop integer not null check (monto_cop > 0)
);

create index aportes_ahorro_viaje_idx on public.aportes_ahorro (viaje_id);

-- ------------------------------------------------------------ seguridad (plan.md 5.3)
-- RLS por propietario. perfiles y viajes comparan auth.uid() directamente; las
-- tablas hijas comprueban que el viaje pertenezca al usuario con un EXISTS.
-- No se otorga a anon: los datos de usuario requieren sesión (authenticated).

alter table public.perfiles enable row level security;
alter table public.viajes enable row level security;
alter table public.viaje_dias enable row level security;
alter table public.viaje_items enable row level security;
alter table public.metas_ahorro enable row level security;
alter table public.aportes_ahorro enable row level security;

-- perfiles: el usuario ve y edita su propia fila (id = auth.uid()).
create policy perfiles_propietario on public.perfiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- viajes: el usuario ve y edita sus viajes (usuario_id = auth.uid()).
create policy viajes_propietario on public.viajes
  for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- Tablas hijas: el acceso depende de que el viaje sea del usuario.
create policy viaje_dias_propietario on public.viaje_dias
  for all to authenticated
  using (exists (
    select 1 from public.viajes v
    where v.id = viaje_dias.viaje_id and v.usuario_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.viajes v
    where v.id = viaje_dias.viaje_id and v.usuario_id = auth.uid()
  ));

create policy viaje_items_propietario on public.viaje_items
  for all to authenticated
  using (exists (
    select 1 from public.viajes v
    where v.id = viaje_items.viaje_id and v.usuario_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.viajes v
    where v.id = viaje_items.viaje_id and v.usuario_id = auth.uid()
  ));

create policy metas_ahorro_propietario on public.metas_ahorro
  for all to authenticated
  using (exists (
    select 1 from public.viajes v
    where v.id = metas_ahorro.viaje_id and v.usuario_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.viajes v
    where v.id = metas_ahorro.viaje_id and v.usuario_id = auth.uid()
  ));

create policy aportes_ahorro_propietario on public.aportes_ahorro
  for all to authenticated
  using (exists (
    select 1 from public.viajes v
    where v.id = aportes_ahorro.viaje_id and v.usuario_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.viajes v
    where v.id = aportes_ahorro.viaje_id and v.usuario_id = auth.uid()
  ));

-- Privilegios: authenticated puede operar (RLS filtra sus filas); anon, nada.
grant select, insert, update, delete on public.perfiles to authenticated;
grant select, insert, update, delete on public.viajes to authenticated;
grant select, insert, update, delete on public.viaje_dias to authenticated;
grant select, insert, update, delete on public.viaje_items to authenticated;
grant select, insert, update, delete on public.metas_ahorro to authenticated;
grant select, insert, update, delete on public.aportes_ahorro to authenticated;

revoke all on public.perfiles from anon;
revoke all on public.viajes from anon;
revoke all on public.viaje_dias from anon;
revoke all on public.viaje_items from anon;
revoke all on public.metas_ahorro from anon;
revoke all on public.aportes_ahorro from anon;
