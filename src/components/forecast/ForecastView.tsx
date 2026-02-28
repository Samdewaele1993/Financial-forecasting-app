import { useMemo, useState } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { calculateForecast, formatMonth } from '../../utils/forecast';
import { ForecastTable } from './ForecastTable';
import { ForecastSummary } from './ForecastSummary';

function currentYear() {
  return new Date().getFullYear();
}

export function ForecastView() {
  const { state } = useAppData();
  const year = currentYear();
  const [viewStart, setViewStart] = useState(`${year}-01`);
  const [viewEnd, setViewEnd] = useState(`${year}-12`);

  const result = useMemo(
    () => calculateForecast(state, viewStart, viewEnd),
    [state, viewStart, viewEnd]
  );

  const rangeError = viewStart > viewEnd;

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
          <ForecastSummary result={result} />
          <ForecastTable result={result} />
        </>
      )}
    </div>
  );
}
