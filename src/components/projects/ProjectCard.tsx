import type { Employee, FixedProjectConfig, Project, TMEntry } from '../../types';

interface ProjectCardProps {
  project: Project;
  config: FixedProjectConfig | null;
  tmEntries: TMEntry[];
  employees: Employee[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, config, tmEntries, employees, onEdit, onDelete }: ProjectCardProps) {
  function handleDelete() {
    if (window.confirm(`Project "${project.name}" verwijderen?`)) {
      onDelete(project.id);
    }
  }

  function getEmployeeName(id: string) {
    return employees.find(e => e.id === id)?.name ?? 'Onbekend';
  }

  return (
    <div className="card">
      <div className="card-info">
        <span className="card-name">{project.name}</span>
        <span className={`badge badge-${project.type}`}>
          {project.type === 'fixed' ? 'Fixed Price' : 'T&M'}
        </span>
      </div>
      <div className="card-detail">
        {project.type === 'fixed' && config ? (
          <span>
            €{config.price.toLocaleString('nl-BE')} over {config.durationMonths} maand{config.durationMonths !== 1 ? 'en' : ''}{' '}
            vanaf {config.startMonth}
            {config.assignedEmployeeIds.length > 0 && (
              <> · {config.assignedEmployeeIds.map(getEmployeeName).join(', ')}</>
            )}
          </span>
        ) : project.type === 'tm' ? (
          <span>{tmEntries.length} registratie{tmEntries.length !== 1 ? 's' : ''}</span>
        ) : (
          <span className="form-hint">Geen configuratie</span>
        )}
      </div>
      <div className="card-actions">
        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(project)}>Bewerken</button>
        <button className="btn btn-sm btn-danger" onClick={handleDelete}>Verwijderen</button>
      </div>
    </div>
  );
}
