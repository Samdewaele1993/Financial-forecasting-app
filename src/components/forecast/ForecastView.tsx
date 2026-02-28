import { useMemo, useState } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { calculateForecast, formatMonth } from '../../utils/forecast';
import { ForecastTable } from './ForecastTable';
import { ForecastSummary } from './ForecastSummary';

type SortField = 'name' | 'revenue' | 'margin';

function currentYear() {
  return new Date().getFullYear();
}

export function ForecastView() {
  const { state } = useAppData();
  const year = currentYear();
  const [viewStart, setViewStart] = useState(`${year}-01`);
  const [viewEnd, setViewEnd] = useState(`${year}-12`);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function toggleEmployee(id: string) {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleProject(id: string) {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc'); // desc is meest logisch voor revenue/margin
    }
  }

  const filteredState = useMemo(() => ({
    ...state,
    employees: selectedEmployeeIds.length > 0
      ? state.employees.filter(e => selectedEmployeeIds.includes(e.id))
      : state.employees,
    projects: selectedProjectIds.length > 0
      ? state.projects.filter(p => selectedProjectIds.includes(p.id))
      : state.projects,
  }), [state, selectedEmployeeIds, selectedProjectIds]);

  const result = useMemo(
    () => calculateForecast(filteredState, viewStart, viewEnd),
    [filteredState, viewStart, viewEnd]
  );

  const sortedResult = useMemo(() => ({
    ...result,
    rows: [...result.rows].sort((a, b) => {
      let val = 0;
      if (sortBy === 'name')    val = a.employeeName.localeCompare(b.employeeName, 'nl');
      if (sortBy === 'revenue') val = a.totalRevenue - b.totalRevenue;
      if (sortBy === 'margin')  val = a.totalMargin  - b.totalMargin;
      return sortDir === 'asc' ? val : -val;
    }),
  }), [result, sortBy, sortDir]);

  const rangeError = viewStart > viewEnd;

  const arrow = (field: SortField) =>
    sortBy === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Forecast</h2>
        <div className="month-range">
          <label className="form-label">Van</label>
          <input
            className="form-input"
            type="month"
            value={viewStart}
            onChange={e => setViewStart(e.target.value)}
          />
          <label className="form-label">Tot</label>
          <input
            className="form-input"
            type="month"
            value={viewEnd}
            onChange={e => setViewEnd(e.target.value)}
          />
        </div>
      </div>

      {/* Filter bar */}
      {(state.employees.length > 0 || state.projects.length > 0) && (
        <div className="forecast-filters">
          {state.employees.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Medewerkers</span>
              <div className="filter-chips">
                {state.employees.map(emp => (
                  <button
                    key={emp.id}
                    className={`filter-chip${selectedEmployeeIds.includes(emp.id) ? ' active' : ''}`}
                    onClick={() => toggleEmployee(emp.id)}
                  >
                    {emp.name}
                  </button>
                ))}
                {selectedEmployeeIds.length > 0 && (
                  <button className="filter-chip-clear" onClick={() => setSelectedEmployeeIds([])}>
                    Wis
                  </button>
                )}
              </div>
            </div>
          )}
          {state.projects.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Projecten</span>
              <div className="filter-chips">
                {state.projects.map(p => (
                  <button
                    key={p.id}
                    className={`filter-chip${selectedProjectIds.includes(p.id) ? ' active' : ''}`}
                    onClick={() => toggleProject(p.id)}
                  >
                    {p.clientName ? `${p.clientName} — ` : ''}{p.name}
                  </button>
                ))}
                {selectedProjectIds.length > 0 && (
                  <button className="filter-chip-clear" onClick={() => setSelectedProjectIds([])}>
                    Wis
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="filter-group">
            <span className="filter-label">Sorteren op</span>
            <div className="sort-controls">
              <button className={`sort-btn${sortBy === 'name' ? ' active' : ''}`} onClick={() => toggleSort('name')}>
                Naam{arrow('name')}
              </button>
              <button className={`sort-btn${sortBy === 'revenue' ? ' active' : ''}`} onClick={() => toggleSort('revenue')}>
                Omzet{arrow('revenue')}
              </button>
              <button className={`sort-btn${sortBy === 'margin' ? ' active' : ''}`} onClick={() => toggleSort('margin')}>
                Marge{arrow('margin')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rangeError ? (
        <p className="form-error">Startmaand moet voor of gelijk aan eindmaand liggen.</p>
      ) : (
        <>
          {result.warnings.length > 0 && (
            <div className="warnings-panel">
              <span className="warnings-title">Overbelasting gedetecteerd</span>
              <ul className="warnings-list">
                {result.warnings.map((w, i) => (
                  <li key={i}>
                    <strong>{w.employeeName}</strong> is overboekt in{' '}
                    <strong>{formatMonth(w.month)}</strong>{' '}
                    ({Math.round(w.utilisation * 100)}% utilisatie)
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ForecastSummary result={sortedResult} />
          <ForecastTable result={sortedResult} />
        </>
      )}
    </div>
  );
}
