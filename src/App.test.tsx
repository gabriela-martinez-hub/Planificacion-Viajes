import { render, screen } from '@testing-library/react';
import App from '@/App';
import { textos } from '@/i18n/es-CO';

describe('App', () => {
  it('muestra los textos de la pantalla inicial desde es-CO.ts', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: textos.app.titulo }),
    ).toBeInTheDocument();
    expect(screen.getByText(textos.app.descripcion)).toBeInTheDocument();
  });
});
