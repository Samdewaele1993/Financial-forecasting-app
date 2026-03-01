import { useState } from 'react';
import type { TabId } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { TabNav } from './TabNav';
import { EmployeeList } from './employees/EmployeeList';
import { ProjectList } from './projects/ProjectList';
import { ForecastView } from './forecast/ForecastView';
import { LoginPage } from './auth/LoginPage';
import { supabase } from '../lib/supabase';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('forecast');
  const { theme, toggle } = useTheme();
  const { session, loading: authLoading } = useAuth();
  const { loading, error } = useAppData();

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-gradient-bar" aria-hidden="true" />
        <button
          className="logo-btn"
          onClick={() => setActiveTab('forecast')}
          title="Ga naar Forecast"
          aria-label="Home — Forecast"
        >
          <img
            src="/logo-ntx.svg"
            alt="NTX"
            className="app-logo"
          />
        </button>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggle}
            title={theme === 'light' ? 'Schakel naar donker thema' : 'Schakel naar licht thema'}
            aria-label="Thema wisselen"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            className="logout-btn"
            onClick={() => supabase.auth.signOut()}
            title="Afmelden"
            aria-label="Afmelden"
          >
            Afmelden
          </button>
        </div>
      </header>
      <main className="app-main">
        {loading ? (
          <div className="app-loading">
            <div className="spinner" />
            <p>Data laden…</p>
          </div>
        ) : error ? (
          <div className="app-error">
            <p>Er is een fout opgetreden bij het laden van de data. Probeer de pagina te vernieuwen.</p>
          </div>
        ) : (
          <>
            {activeTab === 'employees' && <EmployeeList />}
            {activeTab === 'projects' && <ProjectList />}
            {activeTab === 'forecast' && <ForecastView />}
          </>
        )}
      </main>
    </div>
  );
}
