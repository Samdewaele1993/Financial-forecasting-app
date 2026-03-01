import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

const RESET_COOLDOWN_SECONDS = 60;

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (resetCooldown > 0) return;
    setError(null);
    await supabase.auth.resetPasswordForEmail(email);
    setResetSent(true);

    setResetCooldown(RESET_COOLDOWN_SECONDS);
    cooldownTimer.current = setInterval(() => {
      setResetCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand" aria-hidden="true" />
        <div className="login-content">
        <img
          src="/logo-ntx.svg"
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
              disabled={resetCooldown > 0}
            >
              {resetCooldown > 0 ? `Wachtwoord vergeten? (${resetCooldown}s)` : 'Wachtwoord vergeten?'}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
