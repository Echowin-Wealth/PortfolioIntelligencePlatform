import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ClientApp } from './client/ClientApp';
import { MyReports } from './client/pages/MyReports';
import { AdminApp } from './admin/AdminApp';
import { Toaster } from './components/ui/sonner';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientApp />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
