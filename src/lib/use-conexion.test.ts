// Prueba del hook useConexion (T-20). Simula los eventos online/offline del
// navegador y comprueba que el estado reacciona. jsdom provee window y navigator.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConexion } from './use-conexion';

function fijarOnLine(valor: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => valor,
  });
}

afterEach(() => {
  // Restaura onLine a true (valor por defecto de jsdom).
  fijarOnLine(true);
  vi.restoreAllMocks();
});

describe('useConexion', () => {
  it('arranca con el valor de navigator.onLine', () => {
    fijarOnLine(false);
    const { result } = renderHook(() => useConexion());
    expect(result.current).toBe(false);
  });

  it('pasa a false al disparar el evento offline y vuelve con online', () => {
    fijarOnLine(true);
    const { result } = renderHook(() => useConexion());
    expect(result.current).toBe(true);

    act(() => {
      fijarOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      fijarOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
