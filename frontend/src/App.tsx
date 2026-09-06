import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { ToastProvider } from './components/Toasts';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { MemoryPage } from './pages/MemoryPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [view, setView] = useState('dashboard');

  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--cth-cream-100)' }}>
        <TopBar currentView={view} onViewChange={setView} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {view === 'dashboard' && <DashboardPage />}
          {view === 'history' && <HistoryPage />}
          {view === 'memory' && <MemoryPage />}
          {view === 'settings' && <SettingsPage />}
        </div>
      </div>
    </ToastProvider>
  );
}
