'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

type AuthMode = 'login' | 'register' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');

  // Login states
  const [email, setEmail] = useState('employee@serviceops.local');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration states
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot / Reset Password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // If already authenticated, redirect
  if (isAuthenticated) {
    router.push('/dashboard');
  }

  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your corporate email and password.');
      return;
    }

    setLoading(true);
    clearFeedback();

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearFeedback();
    try {
      await api.post('/auth/register', {
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        department: regDepartment || undefined,
      });
      setEmail(regEmail);
      setPassword(regPassword);
      setMode('login');
      setSuccessMsg(`Account created with Employee access for ${regEmail}. You can now sign in.`);
      setRegFirstName('');
      setRegLastName('');
      setRegDepartment('');
      setRegEmail('');
      setRegPassword('');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Registration failed.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setLoading(true);
    clearFeedback();
    try {
      const res = await api.post('/auth/forgot-password', { email: resetEmail });
      setSuccessMsg(
        res.data?.message ||
          'If an active account exists for that email, a single-use reset token has been dispatched.',
      );
      setResetStep('confirm');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to process reset request.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;
    setLoading(true);
    clearFeedback();
    try {
      const res = await api.post('/auth/reset-password', {
        token: resetToken,
        newPassword,
      });
      setSuccessMsg(res.data?.message || 'Password updated! Please sign in with your new password.');
      setMode('login');
      setResetStep('request');
      setResetToken('');
      setNewPassword('');
      if (resetEmail) setEmail(resetEmail);
      setPassword('');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to reset password.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const setQuickCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    clearFeedback();
  };

  return (
    <section id={mode === 'reset' ? 'reset' : 'login'} className="screen is-on" data-screen={mode}>
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

            {mode === 'reset' ? (
              <>
                <h1>Reset access without exposing the account.</h1>
                <p className="lede">
                  If the email matches an active account, a single-use cryptographic token is issued.
                  The screen does not reveal whether the address exists.
                </p>
              </>
            ) : mode === 'register' ? (
              <>
                <h1>Join the desk with least-privilege access.</h1>
                <p className="lede">
                  Self-registered employee accounts receive the standard Employee role automatically.
                  Elevated IT staff roles are provisioned strictly by a System Administrator.
                </p>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          <div className="auth-foot">
            {mode === 'reset'
              ? 'Tokens expire after 30 minutes and revoke existing sessions on reset.'
              : 'Northwind Internal IT · Colombo Office · Live System'}
          </div>
        </div>

        {/* Right Side: Interactive Auth Card */}
        <div className="auth-panel">
          {mode === 'login' && (
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

              {successMsg && (
                <div
                  style={{
                    background: 'var(--moss-bg)',
                    border: '1px solid #c8ddcc',
                    color: 'var(--moss)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 16,
                    fontSize: 13,
                  }}
                >
                  {successMsg}
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
                <button
                  type="button"
                  className="btn"
                  style={{ padding: 0, color: 'var(--ink-soft)', fontSize: 13 }}
                  onClick={() => {
                    clearFeedback();
                    setMode('register');
                  }}
                >
                  Create employee account
                </button>
                <button
                  type="button"
                  className="btn"
                  id="goto-reset"
                  style={{ padding: 0, color: 'var(--copper)', fontSize: 13 }}
                  onClick={() => {
                    clearFeedback();
                    setResetEmail(email);
                    setMode('reset');
                  }}
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
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>Elena</span>
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
          )}

          {mode === 'register' && (
            <form className="auth-card" id="register-form" onSubmit={handleRegister}>
              <h2>Create Employee Account</h2>
              <p className="sub">New registrations receive standard Employee self-service access.</p>

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

              <div className="split-3" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field">
                  <label htmlFor="reg-first">First name</label>
                  <input
                    id="reg-first"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Kasun"
                  />
                </div>
                <div className="field">
                  <label htmlFor="reg-last">Last name</label>
                  <input
                    id="reg-last"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Silva"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="reg-dept">Department</label>
                <input
                  id="reg-dept"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  placeholder="e.g. Finance, Operations, Legal"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-email">Work email</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@serviceops.local"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-pass">Password (min 8 chars)</label>
                <input
                  id="reg-pass"
                  type="password"
                  required
                  minLength={8}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={loading}
                style={{ fontWeight: 600 }}
              >
                {loading ? 'Creating account...' : 'Register Employee Account'}
              </button>

              <p style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  style={{ padding: 0, color: 'var(--copper)', fontSize: 13 }}
                  onClick={() => {
                    clearFeedback();
                    setMode('login');
                  }}
                >
                  &larr; Back to sign in
                </button>
              </p>
            </form>
          )}

          {mode === 'reset' && (
            <div className="auth-card" id="reset-form">
              <h2>Forgot password</h2>
              <p className="sub">We will issue a reset token if an active account uses this address.</p>

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

              {successMsg && (
                <div
                  id="reset-done"
                  style={{
                    background: 'var(--moss-bg)',
                    border: '1px solid #c8ddcc',
                    color: 'var(--moss)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 16,
                    fontSize: 13,
                  }}
                >
                  {successMsg}
                </div>
              )}

              {resetStep === 'request' ? (
                <form onSubmit={handleRequestReset}>
                  <div className="field">
                    <label htmlFor="reset-email">Work email</label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@serviceops.local"
                    />
                  </div>
                  <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                    {loading ? 'Issuing token...' : 'Send reset link'}
                  </button>
                  <p style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: 0, fontSize: 13, color: 'var(--ink-soft)' }}
                      onClick={() => {
                        clearFeedback();
                        setResetStep('confirm');
                      }}
                    >
                      Already have a reset token? Enter it here &rarr;
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset}>
                  <div className="field">
                    <label htmlFor="reset-token">Single-use reset token</label>
                    <input
                      id="reset-token"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste token from email or server log"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="reset-new-pass">New password (min 8 chars)</label>
                    <input
                      id="reset-new-pass"
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                    {loading ? 'Resetting password...' : 'Reset password & Sign in'}
                  </button>
                </form>
              )}

              <p style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  id="back-login"
                  style={{ padding: 0, color: 'var(--copper)', fontSize: 13 }}
                  onClick={() => {
                    clearFeedback();
                    setResetStep('request');
                    setMode('login');
                  }}
                >
                  &larr; Back to sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
