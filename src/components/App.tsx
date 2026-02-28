import { useState } from 'react';
import type { TabId } from '../types';
import { TabNav } from './TabNav';
import { EmployeeList } from './employees/EmployeeList';
import { ProjectList } from './projects/ProjectList';
import { ForecastView } from './forecast/ForecastView';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('forecast');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Financial Forecast</h1>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </header>
      <main className="app-main">
        {activeTab === 'employees' && <EmployeeList />}
        {activeTab === 'projects' && <ProjectList />}
        {activeTab === 'forecast' && <ForecastView />}
      </main>
    </div>
  );
}
