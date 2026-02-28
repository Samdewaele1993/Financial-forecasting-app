import { useState } from 'react';
import type { Employee } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeCard } from './EmployeeCard';

type SortField = 'name' | 'cost';

export function EmployeeList() {
  const { state, dispatch } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function handleSave(emp: Employee) {
    if (editing) {
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: emp });
    } else {
      dispatch({ type: 'ADD_EMPLOYEE', payload: emp });
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleEdit(emp: Employee) {
    setEditing(emp);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
  }

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  const filtered = state.employees
    .filter(e => {
      const q = query.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.title.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const val = sortBy === 'name'
        ? a.name.localeCompare(b.name, 'nl')
        : a.monthlyCost - b.monthlyCost;
      return sortDir === 'asc' ? val : -val;
    });

  const arrow = (field: SortField) =>
    sortBy === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Medewerkers</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Toevoegen
          </button>
        )}
      </div>

      {showForm && (
        <EmployeeForm
          initialValues={editing ?? undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div className="filter-bar">
        <input
          className="form-input search-input"
          placeholder="Zoeken op naam of titel…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="sort-controls">
          <span className="sort-label">Sorteren:</span>
          <button className={`sort-btn${sortBy === 'name' ? ' active' : ''}`} onClick={() => toggleSort('name')}>
            Naam{arrow('name')}
          </button>
          <button className={`sort-btn${sortBy === 'cost' ? ' active' : ''}`} onClick={() => toggleSort('cost')}>
            Kost{arrow('cost')}
          </button>
        </div>
      </div>

      {filtered.length === 0 && !showForm ? (
        <p className="empty-state">
          {state.employees.length === 0
            ? 'Nog geen medewerkers. Voeg er een toe om te beginnen.'
            : 'Geen medewerkers gevonden voor deze zoekopdracht.'}
        </p>
      ) : (
        <div className="card-list">
          {filtered.map(emp => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onEdit={handleEdit}
              onDelete={id => dispatch({ type: 'DELETE_EMPLOYEE', payload: id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
