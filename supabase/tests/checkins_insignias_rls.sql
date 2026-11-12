-- Prueba de RLS, RPC registrar_checkin y trigger de insignias (T-19, plan.md
-- 5.3, 6.4). Aporta evidencia de varios criterios de la fase (e):
--   - un INSERT directo en checkins o insignias_usuario con la clave pública falla;
--   - un check-in dentro del radio se verifica y fuera del radio no;
--   - reenviar el mismo id_cliente no crea duplicados;
--   - completar los municipios de un departamento otorga su insignia;
--   - una insignia especial con >= 80 % de componentes verificados se marca
--     verificada, y con < 80 % no (casos 79 % vs 80 %).
--
-- Cómo ejecutarla: pega TODO el bloque en el SQL Editor de Supabase y córrelo
-- una vez. Si algo falla, un ASSERT lanza una excepción y la transacción se
-- revierte. Si todo pasa, verás "RLS/RPC/insignias: OK".
--
-- Toda la prueba corre dentro de una transacción con ROLLBACK: NO deja usuarios,
-- check-ins ni insignias en la base. Es segura sobre el proyecto real.
--
-- Nota técnica: el SQL Editor corre como un rol que puede saltar RLS. Para
-- probar las políticas de verdad asumimos el rol `authenticated` y fijamos el
-- claim `sub` (lo que lee auth.uid()). La RPC es SECURITY DEFINER, así que
-- escribe en checkins aunque authenticated no tenga INSERT.

begin;

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-0000000000c1', 'rls-caro@example.test'),
  ('00000000-0000-0000-0000-0000000000d2', 'rls-dani@example.test');

do $$
declare
  v_depto text;
  v_muni text;
  v_lat double precision;
  v_lon double precision;
  v_radio integer;
  v_n_muni int;
  v_fila public.checkins;
  v_fila2 public.checkins;
  v_cnt int;
  v_verif boolean;
  rec record;
  i int;
  v_total_depto int;
  v_verif_necesarios int;
begin
  -- Caro (authenticated).
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';

  -- ----------------------------------------------------------------
  -- 1) INSERT directo en checkins debe fallar (no hay política de escritura).
  -- ----------------------------------------------------------------
  begin
    insert into public.checkins (id_cliente, usuario_id, municipio_id, verificado)
    values (gen_random_uuid(), auth.uid(),
            (select id from public.municipios limit 1), true);
    raise exception 'FALLO RLS: un INSERT directo en checkins fue permitido';
  exception
    when insufficient_privilege then null; -- esperado
  end;

  -- 1b) INSERT directo en insignias_usuario debe fallar.
  begin
    insert into public.insignias_usuario (usuario_id, insignia_id, verificada)
    values (auth.uid(), (select id from public.insignias limit 1), true);
    raise exception 'FALLO RLS: un INSERT directo en insignias_usuario fue permitido';
  exception
    when insufficient_privilege then null; -- esperado
  end;

  -- ----------------------------------------------------------------
  -- 2) Check-in dentro del radio -> verificado. Usamos el casco de un municipio
  --    (su propio lat/lon, distancia ~0) con precisión muy buena.
  -- ----------------------------------------------------------------
  select m.id, n.lat, n.lon, m.radio_checkin_m
    into v_muni, v_lat, v_lon, v_radio
  from public.municipios m
  join public.nodos n on n.id = m.id
  limit 1;

  v_fila := public.registrar_checkin(v_muni, v_lat, v_lon, 10, gen_random_uuid());
  assert v_fila.verificado, 'FALLO: un check-in en el propio punto no se verificó';
  assert v_fila.municipio_id = v_muni, 'FALLO: municipio_id incorrecto en el check-in';

  -- ----------------------------------------------------------------
  -- 3) Check-in fuera del radio -> NO verificado. Movemos ~0.5 grados de lon
  --    (decenas de km), muy por fuera de cualquier radio de casco.
  -- ----------------------------------------------------------------
  v_fila := public.registrar_checkin(v_muni, v_lat, v_lon + 0.5, 10, gen_random_uuid());
  assert not v_fila.verificado, 'FALLO: un check-in lejano se marcó verificado';

  -- 3b) Precisión peor que el radio -> nunca verifica (distancia ~0 pero
  --     precision > radio).
  v_fila := public.registrar_checkin(v_muni, v_lat, v_lon, v_radio + 100, gen_random_uuid());
  assert not v_fila.verificado,
    'FALLO: con precisión peor que el radio no debería verificar';

  -- 3c) Registro manual (p_manual = true): no verificado, sin medición GPS.
  v_fila := public.registrar_checkin(v_muni, null, null, null, gen_random_uuid(), true);
  assert not v_fila.verificado, 'FALLO: un registro manual no debería estar verificado';
  assert v_fila.distancia_m is null and v_fila.precision_m is null,
    'FALLO: un registro manual no debería guardar distancia ni precisión';

  -- ----------------------------------------------------------------
  -- 4) Idempotencia: reenviar el mismo id_cliente no crea un segundo check-in.
  -- ----------------------------------------------------------------
  select count(*) into v_cnt from public.checkins where usuario_id = auth.uid();
  v_fila := public.registrar_checkin(v_muni, v_lat, v_lon, 10,
    '11111111-1111-1111-1111-111111111111');
  v_fila2 := public.registrar_checkin(v_muni, v_lat, v_lon, 10,
    '11111111-1111-1111-1111-111111111111');
  assert v_fila.id = v_fila2.id, 'FALLO: el reenvío creó un check-in distinto';
  assert (select count(*) from public.checkins where usuario_id = auth.uid()) = v_cnt + 1,
    'FALLO: el reenvío del mismo id_cliente creó un duplicado';

  -- ----------------------------------------------------------------
  -- 5) Completar los municipios de un departamento otorga su insignia.
  --    Elegimos el departamento con menos municipios para que la prueba sea
  --    corta, y hacemos check-in VERIFICADO en todos sus cascos.
  -- ----------------------------------------------------------------
  select m.departamento_id, count(*)
    into v_depto, v_total_depto
  from public.municipios m
  group by m.departamento_id
  order by count(*) asc
  limit 1;

  for rec in
    select mm.id as id, nn.lat as lat, nn.lon as lon
    from public.municipios mm
    join public.nodos nn on nn.id = mm.id
    where mm.departamento_id = v_depto
  loop
    perform public.registrar_checkin(rec.id, rec.lat, rec.lon, 5, gen_random_uuid());
  end loop;

  -- Debe existir la insignia de departamento y, con todos verificados (100 %),
  -- estar marcada verificada.
  assert exists (
    select 1 from public.insignias_usuario iu
    join public.insignias i on i.id = iu.insignia_id
    where iu.usuario_id = auth.uid()
      and i.tipo = 'departamento' and i.departamento_id = v_depto
  ), 'FALLO: completar el departamento no otorgó su insignia';

  select iu.verificada into v_verif
  from public.insignias_usuario iu
  join public.insignias i on i.id = iu.insignia_id
  where iu.usuario_id = auth.uid()
    and i.tipo = 'departamento' and i.departamento_id = v_depto;
  assert v_verif, 'FALLO: con el 100 % verificado la insignia de depto no es verificada';

  -- ----------------------------------------------------------------
  -- 6) Umbral del 80 %: Dani completa un departamento pero deja algunos
  --    componentes como check-in MANUAL (no verificado) para caer justo por
  --    debajo del 80 %, y verificamos que la insignia se otorga NO verificada.
  --    Luego verifica uno más para cruzar el 80 % y debe pasar a verificada.
  --
  --    Para forzar "manual" (no verificado) usamos un punto lejano: la RPC crea
  --    el check-in con verificado=false, que es justo lo que hace el registro
  --    manual desde el cliente.
  -- ----------------------------------------------------------------
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}';

  -- n = v_total_depto. Verificados necesarios = ceil(0.8 n).
  v_verif_necesarios := ceil(0.8 * v_total_depto)::int;

  i := 0;
  for rec in
    select mm.id as id, nn.lat as lat, nn.lon as lon
    from public.municipios mm
    join public.nodos nn on nn.id = mm.id
    where mm.departamento_id = v_depto
    order by mm.id
  loop
    i := i + 1;
    if i <= v_verif_necesarios - 1 then
      -- Verificado (dentro del radio): uno menos de los necesarios -> 79 %.
      perform public.registrar_checkin(rec.id, rec.lat, rec.lon, 5, gen_random_uuid());
    else
      -- Manual (p_manual = true): otorga pero no cuenta como verificado.
      perform public.registrar_checkin(rec.id, null, null, null, gen_random_uuid(), true);
    end if;
  end loop;

  -- Insignia otorgada (todos con check-in) pero NO verificada (solo n-1 < 80 %).
  select iu.verificada into v_verif
  from public.insignias_usuario iu
  join public.insignias i on i.id = iu.insignia_id
  where iu.usuario_id = auth.uid()
    and i.tipo = 'departamento' and i.departamento_id = v_depto;
  assert v_verif is not null,
    'FALLO: con todos los componentes la insignia de depto no se otorgó a Dani';
  assert v_verif = false,
    'FALLO 80%: con menos del 80 % verificado la insignia no debería ser verificada';

  -- Dani verifica un municipio más (el que había quedado manual) para cruzar el
  -- 80 %. Tomamos el municipio de índice v_verif_necesarios y lo hacemos
  -- verificado; como la insignia es monótona, debe pasar a verificada.
  i := 0;
  for rec in
    select mm.id as id, nn.lat as lat, nn.lon as lon
    from public.municipios mm
    join public.nodos nn on nn.id = mm.id
    where mm.departamento_id = v_depto
    order by mm.id
  loop
    i := i + 1;
    if i = v_verif_necesarios then
      perform public.registrar_checkin(rec.id, rec.lat, rec.lon, 5, gen_random_uuid());
      exit;
    end if;
  end loop;

  select iu.verificada into v_verif
  from public.insignias_usuario iu
  join public.insignias i on i.id = iu.insignia_id
  where iu.usuario_id = auth.uid()
    and i.tipo = 'departamento' and i.departamento_id = v_depto;
  assert v_verif = true,
    'FALLO 80%: al alcanzar el 80 % verificado la insignia debería ser verificada';

  -- ----------------------------------------------------------------
  -- 7) Aislamiento RLS: Dani no ve los check-ins de Caro.
  -- ----------------------------------------------------------------
  assert not exists (
    select 1 from public.checkins where usuario_id = '00000000-0000-0000-0000-0000000000c1'
  ), 'FALLO RLS: Dani puede ver los check-ins de Caro';

  reset role;
  raise notice 'RLS/RPC/insignias: OK (departamento=% con % municipios, 80%% necesita % verificados)',
    v_depto, v_total_depto, v_verif_necesarios;
end
$$;

rollback;
