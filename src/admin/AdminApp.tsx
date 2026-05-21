import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useProfile } from '@/shared/profile';
import { Shell } from './layout/Shell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BenchmarkManager } from './pages/BenchmarkManager';
import { CategoryMapping } from './pages/CategoryMapping';
import { GenerateReport } from './pages/GenerateReport';
import { ReportHistory } from './pages/ReportHistory';

const titles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/benchmarks': 'Benchmark manager',
  '/admin/categories': 'Category mapping',
  '/admin/generate': 'Generate report',
  '/admin/history': 'Report history',
};

function AdminLayout() {
  const { session, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || (session && profileLoading)) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-[var(--color-ink-soft)]">
        <div className="flex items-center gap-2 text-[13px]">
          <Loader2 className="size-4 animate-spin text-[var(--color-brand-500)]" />
          Loading…
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Block non-admin sessions (e.g. Google-signed-in client users) from /admin/*.
  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const title = titles[location.pathname] ?? 'Admin';

  return (
    <Shell title={title} userEmail={session.user.email} onSignOut={signOut}>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="benchmarks" element={<BenchmarkManager />} />
        <Route path="categories" element={<CategoryMapping />} />
        <Route path="generate" element={<GenerateReport />} />
        <Route path="history" element={<ReportHistory />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Shell>
  );
}

export function AdminApp() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const loading = authLoading || (session ? profileLoading : false);

  return (
    <Routes>
      <Route
        path="login"
        element={
          loading
            ? null
            : session && profile?.is_admin
              ? <Navigate to="/admin/dashboard" replace />
              : session && !profile?.is_admin
                ? <Navigate to="/" replace />
                : <Login />
        }
      />
      <Route path="*" element={<AdminLayout />} />
    </Routes>
  );
}
