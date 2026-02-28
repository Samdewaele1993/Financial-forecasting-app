import type { ForecastResult } from '../../types';

interface ForecastSummaryProps {
  result: ForecastResult;
}

function fmt(n: number) {
  return `€${n.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ForecastSummary({ result }: ForecastSummaryProps) {
  const { grandTotalRevenue, grandTotalCost, grandTotalMargin } = result;
  return (
    <div className="summary-cards">
      <div className="stat-card">
        <span className="stat-label">Totale omzet</span>
        <span className="stat-value">{fmt(grandTotalRevenue)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Totale kost</span>
        <span className="stat-value">{fmt(grandTotalCost)}</span>
      </div>
      <div className={`stat-card${grandTotalMargin >= 0 ? ' positive' : ' negative'}`}>
        <span className="stat-label">Marge</span>
        <span className="stat-value">{fmt(grandTotalMargin)}</span>
      </div>
    </div>
  );
}
