import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, persistSession } from '../api.js';

const demoAccounts = [
  { role: 'Fleet Manager', email: 'manager@transitops.dev' },
  { role: 'Driver', email: 'driver@transitops.dev' },
  { role: 'Safety Officer', email: 'safety@transitops.dev' },
  { role: 'Financial Analyst', email: 'finance@transitops.dev' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@transitops.dev');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const session = await login(email, password);
      persistSession(session.token, session.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">TransitOps</p>
        <h1>Fleet operations, without the spreadsheet chaos.</h1>
        <p className="auth-copy">
          Sign in with one of the seeded roles to explore the current backend-powered flow.
        </p>
        <div className="demo-list">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              className="demo-pill"
              onClick={() => setEmail(account.email)}
            >
              {account.role}
            </button>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Enter Dashboard'}
          </button>
          <p className="form-hint">
            Default password for demo users: <code>password123</code>
          </p>
        </form>
      </section>
    </main>
  );
}
