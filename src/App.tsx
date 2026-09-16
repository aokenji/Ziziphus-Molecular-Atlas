// The /react entrypoint, not /next - this is a Vite SPA. It patches the History API,
// so react-router navigations are counted without any per-route wiring.
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AboutRoute } from './routes/AboutRoute';
import { AtlasRoute } from './routes/AtlasRoute';
import { CompoundRoute } from './routes/CompoundRoute';
import { SpeciesDetailRoute, SpeciesListRoute } from './routes/SpeciesRoutes';

function NotFoundRoute() {
  return (
    <div className="wrap empty-screen">
      <h1 className="serif">Nothing here</h1>
      <p className="muted">That page is not part of the atlas.</p>
      <Link to="/" className="button">
        Back to the atlas
      </Link>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<AtlasRoute />} />
          <Route path="compound/:slug" element={<CompoundRoute />} />
          <Route path="species" element={<SpeciesListRoute />} />
          <Route path="species/:slug" element={<SpeciesDetailRoute />} />
          <Route path="about" element={<AboutRoute />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
