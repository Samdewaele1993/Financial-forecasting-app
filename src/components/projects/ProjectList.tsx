import { useState } from 'react';
import type { FixedProjectConfig, Project, TMEntry } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { ProjectForm } from './ProjectForm';
import { ProjectCard } from './ProjectCard';

type StatusFilter = Project['status'] | 'alle';

export function ProjectList() {
  const { state, dispatch } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function handleSave(project: Project, config: FixedProjectConfig | null, tmEntries: TMEntry[]) {
    if (editingProject) {
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: project });
    }

    if (config) {
      dispatch({ type: 'SET_FIXED_CONFIG', payload: config });
    } else {
      const existingEntries = state.tmEntries.filter(e => e.projectId === project.id);
      for (const e of existingEntries) {
        dispatch({ type: 'DELETE_TM_ENTRY', payload: { projectId: e.projectId, employeeId: e.employeeId, month: e.month } });
      }
      for (const entry of tmEntries) {
        dispatch({ type: 'UPSERT_TM_ENTRY', payload: entry });
      }
    }

    setShowForm(false);
    setEditingProject(null);
  }

  function handleEdit(project: Project) {
    setEditingProject(project);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingProject(null);
  }

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'alle', label: 'Alle' },
    { value: 'gepland', label: 'Gepland' },
    { value: 'actief', label: 'Actief' },
    { value: 'afgerond', label: 'Afgerond' },
  ];

  const filtered = state.projects
    .filter(p => {
      const q = query.toLowerCase();
      const matchesQuery =
        p.name.toLowerCase().includes(q) ||
        (p.clientName ?? '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'alle' || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => {
      const val = a.name.localeCompare(b.name, 'nl');
      return sortDir === 'asc' ? val : -val;
    });

  const editingConfig = editingProject
    ? state.fixedConfigs.find(c => c.projectId === editingProject.id)
    : undefined;
  const editingTMEntries = editingProject
    ? state.tmEntries.filter(e => e.projectId === editingProject.id)
    : undefined;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Projecten</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Toevoegen
          </button>
        )}
      </div>

      {showForm && (
        <ProjectForm
          initialProject={editingProject ?? undefined}
          initialFixedConfig={editingConfig}
          initialTMEntries={editingTMEntries}
          employees={state.employees}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div className="filter-bar">
        <input
          className="form-input search-input"
          placeholder="Zoeken op naam of klant…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="status-tabs">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              className={`status-tab${statusFilter === tab.value ? ' active' : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          className="sort-btn"
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          title="Sorteren op naam"
        >
          Naam {sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {filtered.length === 0 && !showForm ? (
        <p className="empty-state">
          {state.projects.length === 0
            ? 'Nog geen projecten. Voeg er een toe om te beginnen.'
            : 'Geen projecten gevonden voor deze filters.'}
        </p>
      ) : (
        <div className="card-list">
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              config={state.fixedConfigs.find(c => c.projectId === project.id) ?? null}
              tmEntries={state.tmEntries.filter(e => e.projectId === project.id)}
              employees={state.employees}
              onEdit={handleEdit}
              onDelete={id => dispatch({ type: 'DELETE_PROJECT', payload: id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
