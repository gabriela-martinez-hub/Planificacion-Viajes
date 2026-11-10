-- Prueba de las políticas RLS de los datos de usuario (T-12, plan.md 5.3).
--
-- Verifica que un usuario autenticado solo ve y modifica sus propias filas y no
-- las de otro. Adelanta evidencia para los criterios RLS de la fase (e).
--
-- Cómo ejecutarla: pega TODO el bloque en el SQL Editor de Supabase y córrelo
-- una vez. Si alguna política no aísla, un ASSERT lanza una excepción con el
-- mensaje correspondiente y la transacción se revierte. Si todo está bien,
-- verás el aviso final "RLS de datos de usuario: OK".
--
-- IMPORTANTE: toda la prueba corre dentro de una transacción con ROLLBACK al
-- final. NO deja usuarios, viajes ni ítems en la base: el estado queda igual que
-- antes de ejecutarla. Es segura de correr sobre el proyecto real.
--
-- Nota técnica: el SQL Editor corre como un rol con privilegios que puede saltar
-- RLS (BYPASSRLS/owner). Para probar las políticas de verdad hay que asumir el
-- rol `authenticated` y fijar el claim `sub` (lo que hace auth.uid()). Por eso
-- cada sección hace `set local role authenticated` y
-- `set local request.jwt.claims`.

begin;

-- Dos usuarios de prueba con uuid fijos (solo viven dentro de esta transacción).
-- Insertamos lo mínimo que exige auth.users; el resto toma sus valores por defecto.
insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-0000000000a1', 'rls-ana@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', 'rls-ben@example.test');

-- Necesitamos un nodo y un municipio reales para las FK de viajes/viaje_items.
-- Tomamos los primeros del catálogo ya cargado (Armenia y Salento deberían
-- existir; si no, el SELECT ... LIMIT 1 toma cualquiera disponible).
do $$
declare
  v_nodo text;
  v_muni text;
  v_atr text;
  v_viaje_ana uuid;
  v_viaje_ben uuid;
  v_visibles int;
begin
  select id into v_nodo from public.nodos limit 1;
  select id into v_muni from public.municipios limit 1;
  select id into v_atr from public.atracciones where not es_casco_urbano limit 1;
  if v_nodo is null or v_muni is null then
    raise exception 'El catálogo no está cargado: faltan nodos o municipios para la prueba';
  end if;

  -- ----------------------------------------------------------------
  -- 1) Ana (authenticated) inserta un viaje suyo. Debe funcionar.
  -- ----------------------------------------------------------------
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

  insert into public.viajes (usuario_id, titulo, fecha_inicio, fecha_fin, origen_nodo_id, viajeros, nivel)
  values (auth.uid(), 'Viaje de Ana', '2026-12-01', '2026-12-03', v_nodo, 2, 'economico')
  returning id into v_viaje_ana;

  -- Ana agrega un día y un ítem a su viaje. Debe funcionar.
  insert into public.viaje_dias (viaje_id, dia, municipio_base_id, nivel_alojamiento, nivel_comida)
  values (v_viaje_ana, 1, v_muni, 'economico', 'economico');

  insert into public.viaje_items (viaje_id, dia, orden, tipo, atraccion_id)
  values (v_viaje_ana, 1, 1, 'actividad', v_atr);

  -- ----------------------------------------------------------------
  -- 2) Ana NO puede insertar un viaje a nombre de Ben (viola with check).
  -- ----------------------------------------------------------------
  begin
    insert into public.viajes (usuario_id, titulo, fecha_inicio, fecha_fin, origen_nodo_id, viajeros, nivel)
    values ('00000000-0000-0000-0000-0000000000b2', 'Suplantación', '2026-12-01', '2026-12-03', v_nodo, 1, 'economico');
    raise exception 'FALLO RLS: Ana pudo crear un viaje a nombre de Ben';
  exception
    when insufficient_privilege or check_violation then
      null; -- esperado: la política rechazó el INSERT
  end;

  -- ----------------------------------------------------------------
  -- 3) Ben (authenticated) inserta su propio viaje.
  -- ----------------------------------------------------------------
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';

  insert into public.viajes (usuario_id, titulo, fecha_inicio, fecha_fin, origen_nodo_id, viajeros, nivel)
  values (auth.uid(), 'Viaje de Ben', '2026-12-10', '2026-12-12', v_nodo, 1, 'medio')
  returning id into v_viaje_ben;

  -- ----------------------------------------------------------------
  -- 4) Ben solo ve su propio viaje, no el de Ana.
  -- ----------------------------------------------------------------
  select count(*) into v_visibles from public.viajes;
  assert v_visibles = 1, 'FALLO RLS: Ben ve ' || v_visibles || ' viajes (debería ver solo 1, el suyo)';

  assert not exists (select 1 from public.viajes where id = v_viaje_ana),
    'FALLO RLS: Ben puede ver el viaje de Ana';

  -- Ben tampoco ve los ítems del viaje de Ana (tabla hija).
  assert not exists (select 1 from public.viaje_items where viaje_id = v_viaje_ana),
    'FALLO RLS: Ben puede ver los ítems del viaje de Ana';

  -- ----------------------------------------------------------------
  -- 5) Ben no puede modificar ni borrar el viaje de Ana.
  -- ----------------------------------------------------------------
  update public.viajes set titulo = 'Hackeado' where id = v_viaje_ana;
  -- La política filtra las filas: el UPDATE no afecta ninguna. Confirmamos que
  -- el título de Ana sigue intacto (lo comprobamos luego como Ana).
  delete from public.viajes where id = v_viaje_ana;
  -- Igual: el DELETE no afecta filas ajenas.

  -- ----------------------------------------------------------------
  -- 6) Volvemos a Ana: su viaje sigue intacto (1 viaje, título original).
  -- ----------------------------------------------------------------
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

  select count(*) into v_visibles from public.viajes;
  assert v_visibles = 1, 'FALLO RLS: Ana ve ' || v_visibles || ' viajes (debería ver solo 1)';

  assert exists (select 1 from public.viajes where id = v_viaje_ana and titulo = 'Viaje de Ana'),
    'FALLO RLS: el viaje de Ana fue alterado o borrado por Ben';

  -- Ana sí ve su propio ítem (la tabla hija deja ver lo propio).
  assert exists (select 1 from public.viaje_items where viaje_id = v_viaje_ana),
    'FALLO RLS: Ana no puede ver los ítems de su propio viaje';

  -- Volvemos al rol por defecto antes de terminar.
  reset role;
  raise notice 'RLS de datos de usuario: OK (aislamiento verificado entre dos usuarios)';
end
$$;

-- Nada de lo anterior se guarda: revertimos todo.
rollback;
