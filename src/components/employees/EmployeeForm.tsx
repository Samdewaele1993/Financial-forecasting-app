import { useState } from 'react';
import type { Employee } from '../../types';

interface EmployeeFormProps {
  initialValues?: Employee;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
}

export function EmployeeForm({ initialValues, onSave, onCancel }: EmployeeFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [monthlyCost, setMonthlyCost] = useState(
    initialValues?.monthlyCost !== undefined ? String(initialValues.monthlyCost) : ''
  );
  const [capacityHours, setCapacityHours] = useState(
    initialValues?.capacityHoursPerMonth !== undefined ? String(initialValues.capacityHoursPerMonth) : '160'
  );
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cost = parseFloat(monthlyCost);
    const capacity = parseFloat(capacityHours);
    if (!name.trim() || !title.trim() || isNaN(cost) || cost < 0) {
      setError('Vul alle velden correct in.');
      return;
    }
    if (isNaN(capacity) || capacity < 0) {
      setError('Geef een geldige capaciteit in.');
      return;
    }
    onSave({
      id: initialValues?.id ?? crypto.randomUUID(),
      name: name.trim(),
      title: title.trim(),
      monthlyCost: cost,
      capacityHoursPerMonth: capacity,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3 className="form-title">{initialValues ? 'Medewerker bewerken' : 'Medewerker toevoegen'}</h3>
      {error && <p className="form-error">{error}</p>}
      <div className="form-group">
        <label className="form-label">Naam</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jan Janssen" maxLength={100} />
      </div>
      <div className="form-group">
        <label className="form-label">Titel</label>
        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Developer" maxLength={100} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Maandelijkse kost (€)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="999999"
            step="0.01"
            value={monthlyCost}
            onChange={e => setMonthlyCost(e.target.value)}
            placeholder="3000"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Capaciteit (uren/maand)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="744"
            step="0.5"
            value={capacityHours}
            onChange={e => setCapacityHours(e.target.value)}
            placeholder="160"
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Opslaan</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuleren</button>
      </div>
    </form>
  );
}
