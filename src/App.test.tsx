import { render, screen } from '@testing-library/react';
import App from '@/App';
import { textos } from '@/i18n/es-CO';

describe('App', () => {
  it('muestra el título desde los textos centralizados (es-CO)', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: textos.app.titulo }),
    ).toBeInTheDocument();
  });
});
