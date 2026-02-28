import { useState } from 'react';
import type { Employee } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeCard } from './EmployeeCard';

export function EmployeeList() {
  const { state, dispatch } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

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

      {state.employees.length === 0 && !showForm ? (
        <p className="empty-state">Nog geen medewerkers. Voeg er een toe om te beginnen.</p>
      ) : (
        <div className="card-list">
          {state.employees.map(emp => (
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
