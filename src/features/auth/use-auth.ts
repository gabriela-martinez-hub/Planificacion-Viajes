import { useContext } from 'react';
import { AuthContext, type EstadoAuth } from './auth-context';

/** Devuelve el estado de autenticación. Debe usarse dentro de <AuthProvider>. */
export function useAuth(): EstadoAuth {
  const contexto = useContext(AuthContext);
  if (contexto === undefined) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return contexto;
}
