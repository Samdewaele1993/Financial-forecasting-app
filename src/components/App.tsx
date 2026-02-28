import { useState } from 'react';
import type { TabId } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useAppData } from '../hooks/useAppData';
import { TabNav } from './TabNav';
import { EmployeeList } from './employees/EmployeeList';
import { ProjectList } from './projects/ProjectList';
import { ForecastView } from './forecast/ForecastView';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('forecast');
  const { theme, toggle } = useTheme();
  const { loading, error } = useAppData();

  return (
    <div className="app">
      <header className="app-header">
        <button
          className="logo-btn"
          onClick={() => setActiveTab('forecast')}
          title="Ga naar Forecast"
          aria-label="Home — Forecast"
        >
          <img
            src="https://ntx.be/wp-content/uploads/2025/08/logo-ntx.svg"
            alt="NTX"
            className="app-logo"
          />
        </button>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        <button
          className="theme-toggle"
          onClick={toggle}
          title={theme === 'light' ? 'Schakel naar donker thema' : 'Schakel naar licht thema'}
          aria-label="Thema wisselen"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      <main className="app-main">
        {loading ? (
          <div className="app-loading">
            <div className="spinner" />
            <p>Data laden…</p>
          </div>
        ) : error ? (
          <div className="app-error">
            <p>Verbindingsfout met database:</p>
            <code>{error}</code>
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
