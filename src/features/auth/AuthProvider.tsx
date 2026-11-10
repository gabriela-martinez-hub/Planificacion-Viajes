import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { AuthContext, type EstadoAuth } from './auth-context';

interface Props {
  children: ReactNode;
}

/**
 * Mantiene la sesión de Supabase en el estado de React.
 * Resuelve la sesión inicial y se suscribe a los cambios (login, logout,
 * refresco de token y el redirect de OAuth).
 */
export function AuthProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      setCargando(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
      setCargando(false);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  const valor = useMemo<EstadoAuth>(
    () => ({
      session,
      usuario: session?.user ?? null,
      cargando,
      async iniciarSesionGoogle(destino?: string) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}${destino ?? ''}`,
          },
        });
      },
      async cerrarSesion() {
        await supabase.auth.signOut();
      },
    }),
    [session, cargando],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
