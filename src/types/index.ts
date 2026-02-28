export interface Employee {
  id: string;
  name: string;
  title: string;
  monthlyCost: number;
  capacityHoursPerMonth: number; // bv. 160
}

export interface Project {
  id: string;
  name: string;
  type: 'fixed' | 'tm';
}

export interface FixedProjectConfig {
  projectId: string;
  price: number;
  startMonth: string; // "YYYY-MM"
  durationMonths: number;
  assignedEmployeeIds: string[];
  estimatedHours?: number; // totaal over het hele project
}

export interface TMEntry {
  projectId: string;
  employeeId: string;
  month: string; // "YYYY-MM"
  hours: number;
  hourlyRate: number;
}

export interface ForecastCell {
  month: string;
  employeeId: string;
  revenue: number;
  cost: number;
  margin: number;
  allocatedHours: number;
  capacityHours: number;
  utilisation: number; // 0–1 (bv. 0.85 = 85%)
}

export interface ForecastRow {
  employeeId: string;
  employeeName: string;
  cells: ForecastCell[];
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  totalAllocatedHours: number;
  totalCapacityHours: number;
  avgUtilisation: number; // gemiddelde over de periode
}

export interface OverloadWarning {
  employeeId: string;
  employeeName: string;
  month: string;
  utilisation: number;
}

export interface ForecastResult {
  months: string[];
  rows: ForecastRow[];
  grandTotalRevenue: number;
  grandTotalCost: number;
  grandTotalMargin: number;
  warnings: OverloadWarning[];
}

export interface AppState {
  employees: Employee[];
  projects: Project[];
  fixedConfigs: FixedProjectConfig[];
  tmEntries: TMEntry[];
}

export type TabId = 'employees' | 'projects' | 'forecast';
