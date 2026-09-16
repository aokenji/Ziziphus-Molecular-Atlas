import { lazy, Suspense, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { LoadingState } from './components/LoadingState/LoadingState';

const HomePage = lazy(() => import('./pages/HomePage/HomePage').then(m => ({ default: m.HomePage })));
const CompoundsPage = lazy(() => import('./pages/CompoundsPage/CompoundsPage').then(m => ({ default: m.CompoundsPage })));
const CompoundDetailPage = lazy(() => import('./pages/CompoundDetailPage/CompoundDetailPage').then(m => ({ default: m.CompoundDetailPage })));
const SpeciesListPage = lazy(() => import('./pages/SpeciesListPage/SpeciesListPage').then(m => ({ default: m.SpeciesListPage })));
const SpeciesDetailPage = lazy(() => import('./pages/SpeciesDetailPage/SpeciesDetailPage').then(m => ({ default: m.SpeciesDetailPage })));
const ReferencesPage = lazy(() => import('./pages/ReferencesPage/ReferencesPage').then(m => ({ default: m.ReferencesPage })));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage/MethodologyPage').then(m => ({ default: m.MethodologyPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
      <main id="main-content" className="app-main">
        <Suspense fallback={<div style={{ padding: '4rem 0' }}><LoadingState text="Loading…" /></div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compounds" element={<CompoundsPage />} />
            <Route path="/compound/:slug" element={<CompoundDetailPage />} />
            <Route path="/species" element={<SpeciesListPage />} />
            <Route path="/species/:slug" element={<SpeciesDetailPage />} />
            <Route path="/references" element={<ReferencesPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
