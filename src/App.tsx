import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { t } from '@/i18n';
import { BotonAuth } from '@/features/auth/BotonAuth';
import { ExplorarCatalogo } from '@/features/catalogo/ExplorarCatalogo';
import { Planificador } from '@/features/planificador/Planificador';
import { MisViajes } from '@/features/planificador/MisViajes';
import { Perfil } from '@/features/insignias/Perfil';

function App() {
  return (
    <div className="mx-auto flex min-h-screen max-w-screen-sm flex-col gap-6 px-4 py-6">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-emerald-800 focus:shadow"
      >
        {t('nav.saltarContenido')}
      </a>
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-emerald-800">
          {t('app.titulo')}
        </h1>
        <p className="text-slate-600">{t('app.descripcion')}</p>
        <BotonAuth />
        <nav
          className="flex gap-1 rounded-lg bg-slate-100 p-1"
          aria-label={t('nav.principal')}
        >
          <EnlaceNav to="/explorar">{t('nav.explorar')}</EnlaceNav>
          <EnlaceNav to="/planificar">{t('nav.planificar')}</EnlaceNav>
          <EnlaceNav to="/mis-viajes">{t('nav.misViajes')}</EnlaceNav>
          <EnlaceNav to="/perfil">{t('nav.perfil')}</EnlaceNav>
        </nav>
      </header>
      <main id="contenido">
        <Routes>
          <Route path="/" element={<Navigate to="/explorar" replace />} />
          <Route path="/explorar" element={<ExplorarCatalogo />} />
          <Route path="/planificar" element={<Planificador />} />
          <Route path="/mis-viajes" element={<MisViajes />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="*" element={<Navigate to="/explorar" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function EnlaceNav({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-4 py-2 text-sm font-medium ${
          isActive
            ? 'bg-white text-emerald-800 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default App;
