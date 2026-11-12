-- T-21: eliminar la cuenta del usuario y todos sus datos (plan.md 5.2, 6.4).
--
-- El cliente usa la clave anon y no puede borrar de auth.users (eso es admin).
-- Por eso exponemos una RPC SECURITY DEFINER que borra ÚNICAMENTE al usuario
-- autenticado (auth.uid()). Todo lo del usuario cuelga de auth.users con
-- ON DELETE CASCADE, así que un solo DELETE arrastra:
--   perfiles, viajes (y sus viaje_dias, viaje_items, metas_ahorro,
--   aportes_ahorro), checkins e insignias_usuario.
-- El catálogo no referencia a auth.users: no se toca.

create or replace function public.eliminar_mi_cuenta()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Se requiere sesión para eliminar la cuenta'
      using errcode = '28000';
  end if;
  -- CASCADE borra en public todo lo que cuelga del usuario.
  delete from auth.users where id = v_uid;
end;
$$;

-- Solo un usuario autenticado puede borrar su propia cuenta; anon no.
revoke all on function public.eliminar_mi_cuenta() from public;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
