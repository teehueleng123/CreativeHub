import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ReferencesPage = lazy(() => import('./pages/ReferencesPage'));
const ResourceDetailPage = lazy(() => import('./pages/ResourceDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SharedResourcePage = lazy(() => import('./pages/SharedResourcePage'));

function PageFallback() {
  return (
    <main className="foundation-shell">
      <p className="page-subtitle">Loading CreativeHub...</p>
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/share/:token" element={<SharedResourcePage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="references" element={<ReferencesPage />} />
            <Route path="resources/:id" element={<ResourceDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
