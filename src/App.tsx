import { t } from '@/i18n';
import { BotonAuth } from '@/features/auth/BotonAuth';

function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold text-emerald-800">{t('app.titulo')}</h1>
      <p className="text-slate-600">{t('app.descripcion')}</p>
      <BotonAuth />
    </main>
  );
}

export default App;
