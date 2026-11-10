import { t } from '@/i18n';
import { BotonAuth } from '@/features/auth/BotonAuth';
import { ExplorarCatalogo } from '@/features/catalogo/ExplorarCatalogo';

function App() {
  return (
    <div className="mx-auto flex min-h-screen max-w-screen-sm flex-col gap-6 px-4 py-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-emerald-800">
          {t('app.titulo')}
        </h1>
        <p className="text-slate-600">{t('app.descripcion')}</p>
        <BotonAuth />
      </header>
      <main>
        <ExplorarCatalogo />
      </main>
    </div>
  );
}

export default App;
