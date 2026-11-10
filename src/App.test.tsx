import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '@/App';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { textos } from '@/i18n/es-CO';

// El cliente real de Supabase necesita variables de entorno y haría red.
// Se reemplaza por un doble que no inicia sesión (usuario = null).
vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithOAuth: () => Promise.resolve({ data: {}, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  },
}));

describe('App', () => {
  it('muestra los textos de la pantalla inicial desde es-CO.ts', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );
    expect(
      screen.getByRole('heading', { name: textos.app.titulo }),
    ).toBeInTheDocument();
    expect(screen.getByText(textos.app.descripcion)).toBeInTheDocument();
  });

  it('ofrece iniciar sesión con Google cuando no hay sesión', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );
    expect(
      await screen.findByRole('button', { name: textos.auth.iniciarSesion }),
    ).toBeInTheDocument();
  });
});
