-- T-19: check-ins e insignias de usuario (plan.md 5.2, 5.3, 6.4).
--
-- Completa las tablas de datos de usuario que T-12 dejó pendientes a propósito:
-- checkins e insignias_usuario, más la lógica de servidor que las gobierna.
--
-- Principio (plan.md, arquitectura sección 4): lo que otorga valor (verificar un
-- check-in, otorgar una insignia) se decide en el SERVIDOR. El cliente nunca
-- escribe `verificado` ni insignias. Por eso:
--   - checkins solo se inserta con la RPC registrar_checkin (SECURITY DEFINER),
--     que calcula la distancia, decide `verificado` y descarta lat/lon.
--   - insignias_usuario solo la escribe un trigger sobre checkins.
--   - Ninguna de las dos tablas tiene política de INSERT/UPDATE/DELETE para
--     anon ni authenticated; solo SELECT de lo propio.

-- ============================================================ tablas

-- ------------------------------------------------------------ checkins
-- No se guardan lat ni lon del usuario (Ley 1581 de 2012, plan.md 5.2 y 6.4).
-- id_cliente evita duplicados cuando la app reintenta un envío fallido.
-- municipio_id siempre presente: un check-in en una atracción cuenta también
-- para el municipio que la contiene (y así otorga su insignia de municipio).

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  id_cliente uuid not null unique,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  atraccion_id text references public.atracciones (id),
  municipio_id text not null references public.municipios (id),
  recibido_en timestamptz not null default now(),
  verificado boolean not null default false,
  distancia_m integer check (distancia_m >= 0),
  precision_m integer check (precision_m >= 0)
);

create index checkins_usuario_idx on public.checkins (usuario_id);
create index checkins_municipio_idx on public.checkins (municipio_id);
create index checkins_atraccion_idx on public.checkins (atraccion_id);

-- ------------------------------------------------------------ insignias_usuario
-- PK (usuario_id, insignia_id): una fila por insignia obtenida.
-- `verificada` solo pasa de false a true, nunca al revés (lo garantiza el
-- trigger con un OR contra el valor anterior).

create table public.insignias_usuario (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  insignia_id text not null references public.insignias (id),
  obtenida_en timestamptz not null default now(),
  verificada boolean not null default false,
  primary key (usuario_id, insignia_id)
);

create index insignias_usuario_usuario_idx on public.insignias_usuario (usuario_id);

-- ============================================================ haversine
-- Distancia en metros entre dos puntos (plan.md 6.4). IMMUTABLE: solo depende de
-- sus argumentos. search_path vacío por seguridad (funciones SECURITY/compartidas).

create or replace function public.distancia_haversine_m(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable
set search_path = ''
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- ============================================================ RPC registrar_checkin
-- Única vía para crear un check-in (plan.md 6.4). SECURITY DEFINER: corre con
-- privilegios del dueño y salta RLS para escribir en checkins, pero solo a
-- nombre del usuario autenticado (auth.uid()).
--
-- p_lugar_id puede ser una atracción o un municipio (su casco urbano). La RPC:
--   1. Resuelve el lugar y su radio: atracción -> su municipio y su radio;
--      municipio -> radio del municipio, sin atracción.
--   2. Si p_manual es true, es un registro manual: verificado = false, sin usar
--      coordenadas (plan.md 6.4: el registro manual crea el check-in no
--      verificado). Si no, calcula la distancia haversine y
--      verificado = (distancia + precision <= radio); precisión peor que el
--      radio nunca verifica.
--   3. Guarda distancia_m y precision_m (null en el registro manual); descarta
--      lat/lon. recibido_en = now().
--   4. Idempotente por id_cliente: un reenvío devuelve la fila existente.
--
-- En un registro manual (p_manual = true) p_lat, p_lon y p_precision_m se
-- ignoran y pueden ser null.

create or replace function public.registrar_checkin(
  p_lugar_id text,
  p_lat double precision,
  p_lon double precision,
  p_precision_m integer,
  p_id_cliente uuid,
  p_manual boolean default false
) returns public.checkins
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_atraccion_id text;
  v_municipio_id text;
  v_lat double precision;
  v_lon double precision;
  v_radio integer;
  v_distancia double precision;
  v_verificado boolean;
  v_distancia_guardar integer;
  v_precision_guardar integer;
  v_existente public.checkins;
  v_fila public.checkins;
begin
  if v_uid is null then
    raise exception 'Se requiere sesión para registrar un check-in'
      using errcode = '28000';
  end if;

  -- En un check-in por GPS la precisión es obligatoria y no negativa. En el
  -- registro manual se ignora.
  if not p_manual and (p_precision_m is null or p_precision_m < 0) then
    raise exception 'La precisión del GPS no es válida' using errcode = '22023';
  end if;

  -- Idempotencia: si ya existe ese id_cliente del mismo usuario, se devuelve.
  select * into v_existente
  from public.checkins
  where id_cliente = p_id_cliente;
  if found then
    if v_existente.usuario_id <> v_uid then
      raise exception 'id_cliente ya usado por otro usuario' using errcode = '23505';
    end if;
    return v_existente;
  end if;

  -- Resolver el lugar: primero como atracción, si no, como municipio.
  select a.id, a.municipio_id, a.lat, a.lon, a.radio_checkin_m
    into v_atraccion_id, v_municipio_id, v_lat, v_lon, v_radio
  from public.atracciones a
  where a.id = p_lugar_id;

  if not found then
    select m.id, n.lat, n.lon, m.radio_checkin_m
      into v_municipio_id, v_lat, v_lon, v_radio
    from public.municipios m
    join public.nodos n on n.id = m.id
    where m.id = p_lugar_id;
    if not found then
      raise exception 'El lugar % no existe', p_lugar_id using errcode = '23503';
    end if;
    v_atraccion_id := null;
  end if;

  if p_manual then
    -- Registro manual: no verificado, sin medición GPS (plan.md 6.4).
    v_verificado := false;
    v_distancia_guardar := null;
    v_precision_guardar := null;
  else
    -- Check-in por GPS: distancia y regla de verificación (plan.md 6.4).
    v_distancia := public.distancia_haversine_m(v_lat, v_lon, p_lat, p_lon);
    v_verificado := (v_distancia + p_precision_m) <= v_radio;
    v_distancia_guardar := round(v_distancia)::integer;
    v_precision_guardar := p_precision_m;
  end if;

  insert into public.checkins (
    id_cliente, usuario_id, atraccion_id, municipio_id,
    verificado, distancia_m, precision_m
  ) values (
    p_id_cliente, v_uid, v_atraccion_id, v_municipio_id,
    v_verificado, v_distancia_guardar, v_precision_guardar
  )
  returning * into v_fila;

  return v_fila;
end;
$$;

-- ============================================================ trigger de insignias
-- Tras cada check-in, recalcula las insignias de progreso del usuario (plan.md
-- 6.4). Reglas de las insignias especiales con n componentes:
--   - Se otorga cuando los n componentes tienen check-in (verificado o manual).
--   - Es verificada si al menos ceil(0.8 * n) componentes tienen check-in
--     verificado.
--   - `verificada` nunca baja: se combina con OR contra el valor anterior.
--
-- Componentes por tipo de insignia:
--   - departamento: los municipios del departamento (check-in en su casco).
--   - eje: los 53 municipios.
--   - ruta: los ruta_items (municipios y/o atracciones).
--   - municipio: el propio municipio (si existe esa insignia en el catálogo).
--   - atraccion: la propia atracción (idem).
-- Un municipio se considera "visitado" si el usuario tiene algún check-in con
-- ese municipio_id (sea en el casco o en una atracción del municipio). Una
-- atracción, si tiene un check-in con ese atraccion_id.

create or replace function public.recalcular_insignias_usuario()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := new.usuario_id;
  r record;
  v_total int;
  v_con_checkin int;
  v_verificados int;
  v_requeridos_verif int;
  v_otorga boolean;
  v_verif boolean;
begin
  -- Recorremos todas las insignias del catálogo y reevaluamos el progreso del
  -- usuario. El volumen es pequeño (unas pocas insignias) y así el resultado no
  -- depende de qué check-in disparó el trigger.
  for r in select * from public.insignias loop
    v_total := 0;
    v_con_checkin := 0;
    v_verificados := 0;

    if r.tipo = 'municipio' then
      v_total := 1;
      select count(*) filter (where true),
             count(*) filter (where c.verificado)
        into v_con_checkin, v_verificados
      from public.checkins c
      where c.usuario_id = v_uid and c.municipio_id = r.municipio_id;
      -- count(*) de arriba cuenta filas; lo normalizamos a 0/1 presencia.
      v_con_checkin := least(v_con_checkin, 1);
      v_verificados := least(v_verificados, 1);

    elsif r.tipo = 'atraccion' then
      v_total := 1;
      select least(count(*), 1),
             least(count(*) filter (where c.verificado), 1)
        into v_con_checkin, v_verificados
      from public.checkins c
      where c.usuario_id = v_uid and c.atraccion_id = r.atraccion_id;

    elsif r.tipo = 'departamento' then
      -- Componentes: municipios del departamento. Visitado = algún check-in
      -- del usuario con ese municipio_id.
      select count(*),
             count(*) filter (where ex.visitado),
             count(*) filter (where ex.verificado)
        into v_total, v_con_checkin, v_verificados
      from public.municipios m
      left join lateral (
        select bool_or(true) as visitado,
               bool_or(c.verificado) as verificado
        from public.checkins c
        where c.usuario_id = v_uid and c.municipio_id = m.id
      ) ex on true
      where m.departamento_id = r.departamento_id;

    elsif r.tipo = 'eje' then
      -- Todos los municipios (los 53).
      select count(*),
             count(*) filter (where ex.visitado),
             count(*) filter (where ex.verificado)
        into v_total, v_con_checkin, v_verificados
      from public.municipios m
      left join lateral (
        select bool_or(true) as visitado,
               bool_or(c.verificado) as verificado
        from public.checkins c
        where c.usuario_id = v_uid and c.municipio_id = m.id
      ) ex on true;

    elsif r.tipo = 'ruta' then
      -- Componentes: ruta_items. Cada ítem es un municipio o una atracción.
      select count(*),
             count(*) filter (where ex.visitado),
             count(*) filter (where ex.verificado)
        into v_total, v_con_checkin, v_verificados
      from public.ruta_items ri
      left join lateral (
        select bool_or(true) as visitado,
               bool_or(c.verificado) as verificado
        from public.checkins c
        where c.usuario_id = v_uid
          and (
            (ri.municipio_id is not null and c.municipio_id = ri.municipio_id)
            or (ri.atraccion_id is not null and c.atraccion_id = ri.atraccion_id)
          )
      ) ex on true
      where ri.ruta_id = r.ruta_id;
    else
      continue;
    end if;

    -- Sin componentes definidos: nada que otorgar.
    if v_total = 0 then
      continue;
    end if;

    -- Se otorga si todos los componentes tienen check-in.
    v_otorga := (v_con_checkin >= v_total);
    if not v_otorga then
      continue;
    end if;

    -- Verificada si al menos ceil(0.8 * n) componentes están verificados.
    v_requeridos_verif := ceil(0.8 * v_total)::int;
    v_verif := (v_verificados >= v_requeridos_verif);

    insert into public.insignias_usuario (usuario_id, insignia_id, verificada)
    values (v_uid, r.id, v_verif)
    on conflict (usuario_id, insignia_id) do update
      -- verificada es monótona: nunca baja.
      set verificada = public.insignias_usuario.verificada or excluded.verificada;
  end loop;

  return new;
end;
$$;

create trigger checkins_otorga_insignias
  after insert on public.checkins
  for each row execute function public.recalcular_insignias_usuario();

-- ============================================================ seguridad (plan.md 5.3)
-- RLS en ambas tablas. Solo SELECT de lo propio. Ninguna política de escritura:
-- checkins lo escribe la RPC (SECURITY DEFINER) e insignias_usuario el trigger.
-- Se revocan insert/update/delete a anon y authenticated.

alter table public.checkins enable row level security;
alter table public.insignias_usuario enable row level security;

create policy checkins_propietario_select on public.checkins
  for select to authenticated
  using (usuario_id = auth.uid());

create policy insignias_usuario_propietario_select on public.insignias_usuario
  for select to authenticated
  using (usuario_id = auth.uid());

-- authenticated solo lee; nunca escribe directamente.
grant select on public.checkins to authenticated;
grant select on public.insignias_usuario to authenticated;
revoke insert, update, delete on public.checkins from anon, authenticated;
revoke insert, update, delete on public.insignias_usuario from anon, authenticated;
revoke all on public.checkins from anon;
revoke all on public.insignias_usuario from anon;

-- La RPC la puede llamar cualquier usuario autenticado; anon no.
revoke all on function public.registrar_checkin(text, double precision, double precision, integer, uuid, boolean) from public;
grant execute on function public.registrar_checkin(text, double precision, double precision, integer, uuid, boolean) to authenticated;
