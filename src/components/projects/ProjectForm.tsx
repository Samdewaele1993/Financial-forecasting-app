import { useState } from 'react';
import type { Employee, FixedProjectConfig, Project, TMEntry } from '../../types';

const STATUS_LABELS: Record<Project['status'], string> = {
  gepland: 'Gepland',
  actief: 'Actief',
  afgerond: 'Afgerond',
};

interface ProjectFormProps {
  initialProject?: Project;
  initialFixedConfig?: FixedProjectConfig;
  initialTMEntries?: TMEntry[];
  employees: Employee[];
  onSave: (project: Project, config: FixedProjectConfig | null, tmEntries: TMEntry[]) => void;
  onCancel: () => void;
}

interface TMRow {
  key: string;
  employeeId: string;
  month: string;
  hours: string;
  hourlyRate: string;
}

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function ProjectForm({
  initialProject,
  initialFixedConfig,
  initialTMEntries,
  employees,
  onSave,
  onCancel,
}: ProjectFormProps) {
  const [name, setName] = useState(initialProject?.name ?? '');
  const [clientName, setClientName] = useState(initialProject?.clientName ?? '');
  const [status, setStatus] = useState<Project['status']>(initialProject?.status ?? 'actief');
  const [type, setType] = useState<'fixed' | 'tm'>(initialProject?.type ?? 'fixed');

  // Fixed fields
  const [price, setPrice] = useState(
    initialFixedConfig?.price !== undefined ? String(initialFixedConfig.price) : ''
  );
  const [startMonth, setStartMonth] = useState(initialFixedConfig?.startMonth ?? currentYearMonth());
  const [durationMonths, setDurationMonths] = useState(
    initialFixedConfig?.durationMonths !== undefined ? String(initialFixedConfig.durationMonths) : '1'
  );
  const [assignedIds, setAssignedIds] = useState<string[]>(
    initialFixedConfig?.assignedEmployeeIds ?? []
  );
  const [estimatedHours, setEstimatedHours] = useState(
    initialFixedConfig?.estimatedHours !== undefined ? String(initialFixedConfig.estimatedHours) : ''
  );

  // T&M rows
  const [tmRows, setTmRows] = useState<TMRow[]>(
    initialTMEntries?.map(e => ({
      key: crypto.randomUUID(),
      employeeId: e.employeeId,
      month: e.month,
      hours: String(e.hours),
      hourlyRate: String(e.hourlyRate),
    })) ?? []
  );

  const [error, setError] = useState('');

  function toggleAssigned(id: string) {
    setAssignedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function addTmRow() {
    setTmRows(prev => [
      ...prev,
      {
        key: crypto.randomUUID(),
        employeeId: employees[0]?.id ?? '',
        month: currentYearMonth(),
        hours: '',
        hourlyRate: '',
      },
    ]);
  }

  function removeTmRow(key: string) {
    setTmRows(prev => prev.filter(r => r.key !== key));
  }

  function updateTmRow(key: string, field: keyof Omit<TMRow, 'key'>, value: string) {
    setTmRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Geef een projectnaam in.'); return; }

    const projectId = initialProject?.id ?? crypto.randomUUID();
    const project: Project = {
      id: projectId,
      name: name.trim(),
      type,
      status,
      ...(clientName.trim() ? { clientName: clientName.trim() } : {}),
    };

    if (type === 'fixed') {
      const priceNum = parseFloat(price);
      const dur = parseInt(durationMonths, 10);
      if (isNaN(priceNum) || priceNum <= 0) { setError('Geef een geldige prijs in.'); return; }
      if (isNaN(dur) || dur < 1) { setError('Geef een geldige looptijd in (min. 1 maand).'); return; }
      const estHours = parseFloat(estimatedHours);
      const config: FixedProjectConfig = {
        projectId,
        price: priceNum,
        startMonth,
        durationMonths: dur,
        assignedEmployeeIds: assignedIds,
        ...(estimatedHours !== '' && !isNaN(estHours) && estHours >= 0 ? { estimatedHours: estHours } : {}),
      };
      onSave(project, config, []);
    } else {
      const entries: TMEntry[] = [];
      for (const row of tmRows) {
        const h = parseFloat(row.hours);
        const r = parseFloat(row.hourlyRate);
        if (!row.employeeId || !row.month) { setError('Vul alle T&M velden in.'); return; }
        if (isNaN(h) || h < 0) { setError('Ongeldige uren in een T&M rij.'); return; }
        if (isNaN(r) || r < 0) { setError('Ongeldig uurtarief in een T&M rij.'); return; }
        entries.push({ projectId, employeeId: row.employeeId, month: row.month, hours: h, hourlyRate: r });
      }
      onSave(project, null, entries);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3 className="form-title">{initialProject ? 'Project bewerken' : 'Project toevoegen'}</h3>
      {error && <p className="form-error">{error}</p>}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Projectnaam</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Klantproject XYZ" />
        </div>
        <div className="form-group">
          <label className="form-label">Klantnaam (optioneel)</label>
          <input className="form-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme NV" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={status} onChange={e => setStatus(e.target.value as Project['status'])}>
            {(Object.keys(STATUS_LABELS) as Project['status'][]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Type</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`toggle-btn${type === 'fixed' ? ' active' : ''}`}
              onClick={() => setType('fixed')}
            >
              Fixed Price
            </button>
            <button
              type="button"
              className={`toggle-btn${type === 'tm' ? ' active' : ''}`}
              onClick={() => setType('tm')}
            >
              T&amp;M
            </button>
          </div>
        </div>
      </div>

      {type === 'fixed' && (
        <>
          <div className="form-group">
            <label className="form-label">Totale projectprijs (€)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="5000"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Startmaand</label>
              <input
                className="form-input"
                type="month"
                value={startMonth}
                onChange={e => setStartMonth(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Looptijd (maanden)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                step="1"
                value={durationMonths}
                onChange={e => setDurationMonths(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Toegewezen medewerkers</label>
            {employees.length === 0 ? (
              <p className="form-hint">Voeg eerst medewerkers toe.</p>
            ) : (
              <div className="checkbox-list">
                {employees.map(emp => (
                  <label key={emp.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={assignedIds.includes(emp.id)}
                      onChange={() => toggleAssigned(emp.id)}
                    />
                    <span>{emp.name} — {emp.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Geschatte uren totaal (optioneel)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.5"
              value={estimatedHours}
              onChange={e => setEstimatedHours(e.target.value)}
              placeholder="bv. 320 (voor utilisatieberekening)"
            />
            <span className="form-hint">Wordt verdeeld over medewerkers en maanden voor utilisatie.</span>
          </div>
          {assignedIds.length > 0 && !isNaN(parseFloat(price)) && !isNaN(parseInt(durationMonths, 10)) && (
            <div className="form-hint">
              Omzet per medewerker per maand:{' '}
              <strong>
                €{(parseFloat(price) / (parseInt(durationMonths, 10) * assignedIds.length)).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
              {estimatedHours !== '' && !isNaN(parseFloat(estimatedHours)) && assignedIds.length > 0 && (
                <> · {(parseFloat(estimatedHours) / (parseInt(durationMonths, 10) * assignedIds.length)).toLocaleString('nl-BE', { maximumFractionDigits: 1 })} u/mw/maand</>
              )}
            </div>
          )}
        </>
      )}

      {type === 'tm' && (
        <div className="form-group">
          <label className="form-label">T&amp;M registraties</label>
          {employees.length === 0 ? (
            <p className="form-hint">Voeg eerst medewerkers toe.</p>
          ) : (
            <>
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Medewerker</th>
                    <th>Maand</th>
                    <th>Uren</th>
                    <th>Uurtarief (€)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tmRows.map(row => (
                    <tr key={row.key}>
                      <td>
                        <select
                          className="form-input"
                          value={row.employeeId}
                          onChange={e => updateTmRow(row.key, 'employeeId', e.target.value)}
                        >
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="month"
                          value={row.month}
                          onChange={e => updateTmRow(row.key, 'month', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.hours}
                          onChange={e => updateTmRow(row.key, 'hours', e.target.value)}
                          placeholder="160"
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.hourlyRate}
                          onChange={e => updateTmRow(row.key, 'hourlyRate', e.target.value)}
                          placeholder="75"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeTmRow(row.key)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addTmRow}>
                + Rij toevoegen
              </button>
            </>
          )}
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Opslaan</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuleren</button>
      </div>
    </form>
  );
}
