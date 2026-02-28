import type { AppState, ForecastCell, ForecastResult, ForecastRow, OverloadWarning } from '../types';

function generateMonths(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  let [year, month] = startMonth.split('-').map(Number);
  const [endYear, endMon] = endMonth.split('-').map(Number);

  while (year < endYear || (year === endYear && month <= endMon)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month++;
    if (month > 12) { month = 1; year++; }
  }
  return months;
}

function addMonths(startMonth: string, count: number): string {
  let [year, month] = startMonth.split('-').map(Number);
  month += count - 1;
  while (month > 12) { month -= 12; year++; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatMonth(month: string): string {
  const [year, mon] = month.split('-');
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleString('nl-BE', { month: 'short', year: 'numeric' });
}

export function utilisationClass(u: number): string {
  if (u > 1.0) return 'util-over';
  if (u >= 0.8) return 'util-warn';
  return 'util-ok';
}

export function calculateForecast(
  state: AppState,
  viewStartMonth: string,
  viewEndMonth: string
): ForecastResult {
  const months = generateMonths(viewStartMonth, viewEndMonth);

  // revenue accumulator: employeeId -> month -> revenue
  const revenueMap = new Map<string, Map<string, number>>();
  // hours accumulator: employeeId -> month -> allocated hours
  const hoursMap = new Map<string, Map<string, number>>();

  for (const emp of state.employees) {
    revenueMap.set(emp.id, new Map(months.map(m => [m, 0])));
    hoursMap.set(emp.id, new Map(months.map(m => [m, 0])));
  }

  // Accumulate fixed project revenue + hours
  for (const config of state.fixedConfigs) {
    const project = state.projects.find(p => p.id === config.projectId);
    if (!project || project.type !== 'fixed') continue;
    if (config.assignedEmployeeIds.length === 0 || config.durationMonths === 0) continue;

    const n = config.assignedEmployeeIds.length;
    const cellRevenue = config.price / (config.durationMonths * n);
    const cellHours = config.estimatedHours != null
      ? config.estimatedHours / (config.durationMonths * n)
      : 0;

    const projectEndMonth = addMonths(config.startMonth, config.durationMonths);
    const projectMonths = new Set(generateMonths(config.startMonth, projectEndMonth));

    for (const empId of config.assignedEmployeeIds) {
      const empRev = revenueMap.get(empId);
      const empHrs = hoursMap.get(empId);
      if (!empRev || !empHrs) continue;
      for (const month of months) {
        if (projectMonths.has(month)) {
          empRev.set(month, (empRev.get(month) ?? 0) + cellRevenue);
          empHrs.set(month, (empHrs.get(month) ?? 0) + cellHours);
        }
      }
    }
  }

  // Accumulate T&M revenue + hours
  for (const entry of state.tmEntries) {
    const empRev = revenueMap.get(entry.employeeId);
    const empHrs = hoursMap.get(entry.employeeId);
    if (!empRev || !empHrs || !empRev.has(entry.month)) continue;
    empRev.set(entry.month, (empRev.get(entry.month) ?? 0) + entry.hours * entry.hourlyRate);
    empHrs.set(entry.month, (empHrs.get(entry.month) ?? 0) + entry.hours);
  }

  // Build rows + warnings
  let grandTotalRevenue = 0;
  let grandTotalCost = 0;
  const warnings: OverloadWarning[] = [];

  const rows: ForecastRow[] = state.employees.map(emp => {
    const empRevMap = revenueMap.get(emp.id)!;
    const empHrsMap = hoursMap.get(emp.id)!;
    const capacity = emp.capacityHoursPerMonth;

    const cells: ForecastCell[] = months.map(month => {
      const revenue = empRevMap.get(month) ?? 0;
      const cost = emp.monthlyCost;
      const allocatedHours = empHrsMap.get(month) ?? 0;
      const utilisation = capacity > 0 ? allocatedHours / capacity : 0;

      if (utilisation > 1.0) {
        warnings.push({ employeeId: emp.id, employeeName: emp.name, month, utilisation });
      }

      return { month, employeeId: emp.id, revenue, cost, margin: revenue - cost, allocatedHours, capacityHours: capacity, utilisation };
    });

    const totalRevenue = cells.reduce((s, c) => s + c.revenue, 0);
    const totalCost = cells.reduce((s, c) => s + c.cost, 0);
    const totalAllocatedHours = cells.reduce((s, c) => s + c.allocatedHours, 0);
    const totalCapacityHours = capacity * months.length;
    const avgUtilisation = totalCapacityHours > 0 ? totalAllocatedHours / totalCapacityHours : 0;

    grandTotalRevenue += totalRevenue;
    grandTotalCost += totalCost;

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      cells,
      totalRevenue,
      totalCost,
      totalMargin: totalRevenue - totalCost,
      totalAllocatedHours,
      totalCapacityHours,
      avgUtilisation,
    };
  });

  return {
    months,
    rows,
    grandTotalRevenue,
    grandTotalCost,
    grandTotalMargin: grandTotalRevenue - grandTotalCost,
    warnings,
  };
}
