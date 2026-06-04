import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ClientApp } from './client/ClientApp';
import { Toaster } from './components/ui/sonner';

// Route-level code splitting: keep the landing page (ClientApp) eager since it's
// the LCP critical path, but defer the report viewer and the admin console so
// their heavy dependencies (recharts, xlsx, jspdf, cmdk) are never shipped to
// first-time visitors of "/".
const MyReports = lazy(() =>
  import('./client/pages/MyReports').then((m) => ({ default: m.MyReports }))
);
const AdminApp = lazy(() =>
  import('./admin/AdminApp').then((m) => ({ default: m.AdminApp }))
);

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<ClientApp />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
