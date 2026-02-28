import { useState } from 'react';
import type { FixedProjectConfig, Project, TMEntry } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { ProjectForm } from './ProjectForm';
import { ProjectCard } from './ProjectCard';

export function ProjectList() {
  const { state, dispatch } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  function handleSave(project: Project, config: FixedProjectConfig | null, tmEntries: TMEntry[]) {
    if (editingProject) {
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: project });
    }

    if (config) {
      dispatch({ type: 'SET_FIXED_CONFIG', payload: config });
    } else {
      // T&M: remove old entries for this project, add new ones
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

      {state.projects.length === 0 && !showForm ? (
        <p className="empty-state">Nog geen projecten. Voeg er een toe om te beginnen.</p>
      ) : (
        <div className="card-list">
          {state.projects.map(project => (
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
