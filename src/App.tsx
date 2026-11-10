import { textos } from '@/i18n/es-CO';

function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-emerald-800">{textos.app.titulo}</h1>
      <p className="text-slate-600">{textos.app.descripcion}</p>
    </main>
  );
}

export default App;
