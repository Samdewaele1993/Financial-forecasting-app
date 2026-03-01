import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (err) setError('E-mail of wachtwoord onjuist.');
  }

  async function handleReset() {
    if (!email) {
      setError('Vul eerst je e-mailadres in.');
      return;
    }
    setError(null);
    await supabase.auth.resetPasswordForEmail(email);
    setResetSent(true);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img
          src="https://ntx.be/wp-content/uploads/2025/08/logo-ntx.svg"
          alt="NTX"
          className="login-logo"
        />
        <h1 className="login-title">Financial Forecast</h1>

        {resetSent ? (
          <p className="login-reset-msg">
            Wachtwoord-reset e-mail verstuurd. Controleer je inbox.
          </p>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mailadres</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Wachtwoord</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="btn-primary login-btn" type="submit" disabled={loading}>
              {loading ? 'Bezig…' : 'Inloggen'}
            </button>

            <button
              type="button"
              className="login-reset-link"
              onClick={handleReset}
            >
              Wachtwoord vergeten?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
