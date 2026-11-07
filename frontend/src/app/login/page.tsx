'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('amina.perera@northwind.example');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect
  if (isAuthenticated) {
    router.push('/dashboard');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your corporate email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Authentication failed. Please verify your credentials.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const setQuickCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setErrorMsg(null);
  };

  return (
    <section id="login" className="screen is-on" data-screen="login">
      <div className="auth">
        {/* Left Side: Brand Story & Philosophy */}
        <div className="auth-story">
          <div>
            <div className="brand-row">
              <span className="mark">
                <i></i>
              </span>{' '}
              ServiceOps
            </div>
            <h1>One desk for every request, incident, and deadline.</h1>
            <p className="lede">
              Employees ask for help in one place. The IT team assigns, investigates,
              and closes the work without losing the history.
            </p>
            <ol className="flow">
              <li>
                <b>01</b>
                <span>Submit a request with the category, urgency, and anything the agent will need.</span>
              </li>
              <li>
                <b>02</b>
                <span>A manager or rule gives the ticket an owner. The SLA clock starts with the policy that applied at that moment.</span>
              </li>
              <li>
                <b>03</b>
                <span>The agent investigates, writes to the employee, and keeps internal notes off the public thread.</span>
              </li>
              <li>
                <b>04</b>
                <span>Resolution is recorded. The employee confirms, and the ticket closes.</span>
              </li>
              <li>
                <b>05</b>
                <span>Deadlines, breaches, and privileged changes stay on the record.</span>
              </li>
            </ol>
          </div>
          <div className="auth-foot">Northwind Internal IT · Colombo Office · Live System</div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="auth-panel">
          <form className="auth-card" id="signin-form" onSubmit={handleSubmit}>
            <h2>Sign in</h2>
            <p className="sub">Use your work email. New accounts receive the Employee role.</p>

            {errorMsg && (
              <div
                style={{
                  background: 'var(--rose-bg)',
                  border: '1px solid #f2cccc',
                  color: 'var(--rose)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="row-between" style={{ marginBottom: 16 }}>
              <span className="hint" style={{ margin: 0 }}>
                Session stays on this browser until you sign out.
              </span>
              <button
                type="button"
                className="btn"
                id="goto-reset"
                style={{ padding: 0, color: 'var(--copper)' }}
              >
                Forgot password
              </button>
            </div>

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={loading}
              style={{ fontWeight: 600 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Interactive Demo Quick-Fill Bar */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid var(--line)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                Test Accounts (Pre-Seeded)
              </span>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuickCredentials('employee@serviceops.local')}
                  className="btn btn-ghost"
                  style={{
                    fontSize: 12,
                    padding: '8px 10px',
                    justifyContent: 'flex-start',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: 'var(--sky)', fontWeight: 600 }}>Employee</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>Amina</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCredentials('agent@serviceops.local')}
                  className="btn btn-ghost"
                  style={{
                    fontSize: 12,
                    padding: '8px 10px',
                    justifyContent: 'flex-start',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: 'var(--moss)', fontWeight: 600 }}>Agent</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>R. Chen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCredentials('manager@serviceops.local')}
                  className="btn btn-ghost"
                  style={{
                    fontSize: 12,
                    padding: '8px 10px',
                    justifyContent: 'flex-start',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Manager</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>Marcus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCredentials('admin@serviceops.local')}
                  className="btn btn-ghost"
                  style={{
                    fontSize: 12,
                    padding: '8px 10px',
                    justifyContent: 'flex-start',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: 'var(--rose)', fontWeight: 600 }}>Admin</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>Sarah</span>
                </button>
              </div>

              <p className="hint" style={{ textAlign: 'center', marginTop: 10 }}>
                Default Password: <code className="mono">Password@123</code>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
