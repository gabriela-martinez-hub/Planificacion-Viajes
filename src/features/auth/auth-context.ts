import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface EstadoAuth {
  /** Sesión actual, o null si no hay sesión iniciada. */
  session: Session | null;
  /** Usuario actual, o null. Atajo de session?.user. */
  usuario: User | null;
  /** true mientras se resuelve la sesión inicial. */
  cargando: boolean;
  /** Inicia sesión con Google (redirige a Google y de vuelta a la app). */
  iniciarSesionGoogle: () => Promise<void>;
  /** Cierra la sesión actual. */
  cerrarSesion: () => Promise<void>;
}

export const AuthContext = createContext<EstadoAuth | undefined>(undefined);
