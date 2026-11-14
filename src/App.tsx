import { Route, Routes, Navigate } from 'react-router-dom';
import { t } from '@/i18n';
import { TopBar } from '@/features/shell/TopBar';
import { Sidebar } from '@/features/shell/Sidebar';
import { BottomNav } from '@/features/shell/BottomNav';
import { ExplorarCatalogo } from '@/features/catalogo/ExplorarCatalogo';
import { Planificador } from '@/features/planificador/Planificador';
import { MisViajes } from '@/features/planificador/MisViajes';
import { Perfil } from '@/features/insignias/Perfil';

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-crema-claro focus:px-4 focus:py-2 focus:text-selva-800 focus:shadow"
      >
        {t('nav.saltarContenido')}
      </a>

      <TopBar />

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        <Sidebar />
        <main
          id="contenido"
          className="min-w-0 flex-1 pb-24 md:pb-0"
          tabIndex={-1}
        >
          {/* Las páginas se animan al montar desde su propio contenedor
              (PaginaAnimada); no envolvemos las rutas en un wrapper keyed para
              no remontar el árbol y abortar peticiones en vuelo. */}
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

      <BottomNav />
    </div>
  );
}

export default App;
