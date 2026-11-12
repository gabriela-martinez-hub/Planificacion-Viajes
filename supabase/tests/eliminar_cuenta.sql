-- Prueba de la RPC eliminar_mi_cuenta (T-21, plan.md 6.4). Verifica que borrar
-- la cuenta del usuario arrastra en cascada todos sus datos y no toca los de
-- otro usuario ni el catálogo.
--
-- Corre dentro de una transacción con ROLLBACK: NO deja nada en la base. Pega
-- todo el bloque en el SQL Editor o ejecútalo con psql.

begin;

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-0000000000e1', 'rls-eva@example.test'),
  ('00000000-0000-0000-0000-0000000000f2', 'rls-fausto@example.test');

do $$
declare
  v_nodo text;
  v_muni text;
  v_atr text;
  v_viaje_eva uuid;
  v_viaje_fausto uuid;
begin
  select id into v_nodo from public.nodos limit 1;
  select id into v_muni from public.municipios limit 1;
  select id into v_atr from public.atracciones where not es_casco_urbano limit 1;

  -- -------- Eva crea datos en todas sus tablas --------
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';

  insert into public.perfiles (id, consentimiento_datos_en)
  values (auth.uid(), now());

  insert into public.viajes (usuario_id, titulo, fecha_inicio, fecha_fin, origen_nodo_id, viajeros, nivel)
  values (auth.uid(), 'Viaje de Eva', '2026-12-01', '2026-12-03', v_nodo, 2, 'economico')
  returning id into v_viaje_eva;

  insert into public.viaje_dias (viaje_id, dia, municipio_base_id, nivel_alojamiento, nivel_comida)
  values (v_viaje_eva, 1, v_muni, 'economico', 'economico');
  insert into public.viaje_items (viaje_id, dia, orden, tipo, atraccion_id)
  values (v_viaje_eva, 1, 1, 'actividad', v_atr);
  insert into public.metas_ahorro (viaje_id, monto_objetivo_cop, frecuencia)
  values (v_viaje_eva, 500000, 'mensual');
  insert into public.aportes_ahorro (viaje_id, fecha, monto_cop)
  values (v_viaje_eva, '2026-11-12', 50000);

  -- Check-in (vía RPC) e insignia (vía trigger) de Eva.
  perform public.registrar_checkin(v_muni,
    (select n.lat from public.nodos n where n.id = v_muni),
    (select n.lon from public.nodos n where n.id = v_muni),
    5, gen_random_uuid());

  -- -------- Fausto crea un viaje suyo (no debe borrarse) --------
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated"}';
  insert into public.viajes (usuario_id, titulo, fecha_inicio, fecha_fin, origen_nodo_id, viajeros, nivel)
  values (auth.uid(), 'Viaje de Fausto', '2026-12-10', '2026-12-12', v_nodo, 1, 'medio')
  returning id into v_viaje_fausto;

  -- -------- Eva elimina su cuenta --------
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
  perform public.eliminar_mi_cuenta();

  -- Volvemos a un rol con visión completa para comprobar el borrado real.
  reset role;

  assert not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000e1'),
    'FALLO: la cuenta de Eva no se borró de auth.users';
  assert not exists (select 1 from public.perfiles where id = '00000000-0000-0000-0000-0000000000e1'),
    'FALLO: el perfil de Eva no se borró en cascada';
  assert not exists (select 1 from public.viajes where usuario_id = '00000000-0000-0000-0000-0000000000e1'),
    'FALLO: los viajes de Eva no se borraron';
  assert not exists (select 1 from public.viaje_dias where viaje_id = v_viaje_eva),
    'FALLO: los días del viaje de Eva no se borraron';
  assert not exists (select 1 from public.viaje_items where viaje_id = v_viaje_eva),
    'FALLO: los ítems del viaje de Eva no se borraron';
  assert not exists (select 1 from public.metas_ahorro where viaje_id = v_viaje_eva),
    'FALLO: la meta de Eva no se borró';
  assert not exists (select 1 from public.aportes_ahorro where viaje_id = v_viaje_eva),
    'FALLO: los aportes de Eva no se borraron';
  assert not exists (select 1 from public.checkins where usuario_id = '00000000-0000-0000-0000-0000000000e1'),
    'FALLO: los check-ins de Eva no se borraron';
  assert not exists (select 1 from public.insignias_usuario where usuario_id = '00000000-0000-0000-0000-0000000000e1'),
    'FALLO: las insignias de Eva no se borraron';

  -- Fausto y el catálogo siguen intactos.
  assert exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000f2'),
    'FALLO: se borró la cuenta de Fausto';
  assert exists (select 1 from public.viajes where id = v_viaje_fausto),
    'FALLO: se borró el viaje de Fausto';
  assert (select count(*) from public.municipios) > 0,
    'FALLO: se tocó el catálogo de municipios';

  raise notice 'eliminar_mi_cuenta: OK (cascada completa, sin tocar a otros ni al catálogo)';
end
$$;

rollback;
