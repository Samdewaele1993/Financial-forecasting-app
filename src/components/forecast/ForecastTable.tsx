import type { ForecastResult } from '../../types';
import { formatMonth, utilisationClass } from '../../utils/forecast';

interface ForecastTableProps {
  result: ForecastResult;
}

function fmtEur(n: number) {
  return n === 0 ? '—' : `€${n.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtUtil(allocatedHours: number, capacityHours: number, utilisation: number) {
  if (capacityHours === 0) return '—';
  const pct = Math.round(utilisation * 100);
  return `${allocatedHours.toLocaleString('nl-BE', { maximumFractionDigits: 1 })}/${capacityHours}u (${pct}%)`;
}

function marginClass(n: number) {
  if (n > 0) return 'positive';
  if (n < 0) return 'negative';
  return '';
}

export function ForecastTable({ result }: ForecastTableProps) {
  const { months, rows } = result;

  if (rows.length === 0) {
    return <p className="empty-state">Voeg medewerkers en projecten toe om de forecast te zien.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="forecast-table">
        <thead>
          <tr>
            <th className="sticky-col">Medewerker</th>
            {months.map(m => <th key={m}>{formatMonth(m)}</th>)}
            <th>Totaal / Gem.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <>
              <tr key={`${row.employeeId}-rev`} className="group-start">
                <td className="sticky-col employee-cell" rowSpan={4}>
                  <span className="emp-name">{row.employeeName}</span>
                </td>
                {row.cells.map(cell => (
                  <td key={cell.month} className="num-cell revenue-cell">{fmtEur(cell.revenue)}</td>
                ))}
                <td className="num-cell revenue-cell total-cell">{fmtEur(row.totalRevenue)}</td>
              </tr>
              <tr key={`${row.employeeId}-cost`} className="cost-row">
                {row.cells.map(cell => (
                  <td key={cell.month} className="num-cell">{fmtEur(cell.cost)}</td>
                ))}
                <td className="num-cell total-cell">{fmtEur(row.totalCost)}</td>
              </tr>
              <tr key={`${row.employeeId}-margin`} className="margin-row">
                {row.cells.map(cell => (
                  <td key={cell.month} className={`num-cell ${marginClass(cell.margin)}`}>{fmtEur(cell.margin)}</td>
                ))}
                <td className={`num-cell total-cell ${marginClass(row.totalMargin)}`}>{fmtEur(row.totalMargin)}</td>
              </tr>
              <tr key={`${row.employeeId}-util`} className="util-row">
                {row.cells.map(cell => (
                  <td
                    key={cell.month}
                    className={`num-cell util-cell ${utilisationClass(cell.utilisation)}`}
                    title={cell.capacityHours > 0 ? `${Math.round(cell.utilisation * 100)}% utilisatie` : 'Geen capaciteit ingesteld'}
                  >
                    {fmtUtil(cell.allocatedHours, cell.capacityHours, cell.utilisation)}
                  </td>
                ))}
                <td className={`num-cell total-cell util-cell ${utilisationClass(row.avgUtilisation)}`}>
                  {row.totalCapacityHours > 0
                    ? `${Math.round(row.avgUtilisation * 100)}% gem.`
                    : '—'}
                </td>
              </tr>
            </>
          ))}
        </tbody>
        <tfoot>
          <tr className="grand-total-row">
            <td className="sticky-col">Totaal omzet</td>
            {rows[0]?.cells.map((_, i) => {
              const colRevenue = rows.reduce((s, r) => s + r.cells[i].revenue, 0);
              return <td key={i} className="num-cell revenue-cell">{fmtEur(colRevenue)}</td>;
            })}
            <td className="num-cell revenue-cell total-cell">{fmtEur(result.grandTotalRevenue)}</td>
          </tr>
          <tr className="grand-total-row cost-row">
            <td className="sticky-col">Totaal kost</td>
            {rows[0]?.cells.map((_, i) => {
              const colCost = rows.reduce((s, r) => s + r.cells[i].cost, 0);
              return <td key={i} className="num-cell">{fmtEur(colCost)}</td>;
            })}
            <td className="num-cell total-cell">{fmtEur(result.grandTotalCost)}</td>
          </tr>
          <tr className="grand-total-row margin-row">
            <td className="sticky-col">Marge</td>
            {rows[0]?.cells.map((_, i) => {
              const colMargin = rows.reduce((s, r) => s + r.cells[i].margin, 0);
              return <td key={i} className={`num-cell ${marginClass(colMargin)}`}>{fmtEur(colMargin)}</td>;
            })}
            <td className={`num-cell total-cell ${marginClass(result.grandTotalMargin)}`}>{fmtEur(result.grandTotalMargin)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
