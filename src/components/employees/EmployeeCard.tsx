import type { Employee } from '../../types';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  function handleDelete() {
    if (window.confirm(`Medewerker "${employee.name}" verwijderen?`)) {
      onDelete(employee.id);
    }
  }

  return (
    <div className="card">
      <div className="card-avatar" aria-hidden="true">{employee.name.charAt(0)}</div>
      <div className="card-info">
        <span className="card-name">{employee.name}</span>
        <span className="card-sub">{employee.title}</span>
      </div>
      <div className="card-meta">
        <span className="card-cost">€{employee.monthlyCost.toLocaleString('nl-BE')}/maand</span>
      </div>
      <div className="card-actions">
        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(employee)}>Bewerken</button>
        <button className="btn btn-sm btn-danger" onClick={handleDelete}>Verwijderen</button>
      </div>
    </div>
  );
}
