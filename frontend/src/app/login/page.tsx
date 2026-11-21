'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

type AuthMode = 'login' | 'register' | 'reset';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');

  // Login states - initialize empty for production
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
  const [resetStep, setResetStep] = useState<'request' | 'otp' | 'new-password'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Read URL search params (e.g. from Brevo password reset link)
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const codeParam = searchParams.get('code') || searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (modeParam === 'reset') {
      setMode('reset');
      if (emailParam) {
        setResetEmail(emailParam);
      }
      if (codeParam) {
        setResetToken(codeParam);
        // Pre-validate the code from URL link
        api
          .post('/auth/verify-reset-code', {
            code: codeParam,
            email: emailParam || undefined,
          })
          .then(() => {
            setResetStep('new-password');
          })
          .catch(() => {
            setResetStep('otp');
          });
      }
    }
  }, [searchParams]);

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
      setSuccessMsg(
        `Registration received! Your employee account requires approval from a System Administrator before signing in.`,
      );
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
      await api.post('/auth/forgot-password', { email: resetEmail });
      // Transition immediately to OTP step without showing any email dispatch banner
      setResetStep('otp');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to process reset request.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = resetToken.trim();
    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }
    setLoading(true);
    clearFeedback();
    try {
      await api.post('/auth/verify-reset-code', {
        code: cleanCode,
        email: resetEmail || undefined,
      });
      // OTP is valid - advance to enter and confirm new password
      setResetStep('new-password');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Invalid or expired verification code.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setErrorMsg('Verification code is missing. Please restart the reset process.');
      setResetStep('otp');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both passwords match exactly.');
      return;
    }
    setLoading(true);
    clearFeedback();
    try {
      const res = await api.post('/auth/reset-password', {
        token: resetToken,
        newPassword,
      });
      setSuccessMsg(res.data?.message || 'Password updated successfully! Please sign in with your new password.');
      setMode('login');
      setResetStep('request');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      if (resetEmail) setEmail(resetEmail);
      setPassword('');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to reset password.';
      setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id={mode === 'reset' ? 'reset' : 'login'} className="screen is-on" data-screen={mode}>
      <div className="auth">
        {/* Left Side: Brand Story & Philosophy */}
        <div className="auth-story">
          <div>
            <Link href="/" className="brand-row hover:opacity-85" style={{ textDecoration: 'none' }}>
              <span className="mark">
                <i></i>
              </span>{' '}
              ServiceOps
            </Link>

            {mode === 'reset' ? (
              <>
                <h1>Reset your account access.</h1>
                <p className="lede">
                  Follow the verification steps to securely choose a new password for your account.
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
              ? 'Verification codes expire after 30 minutes and revoke existing sessions on reset.'
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
                  style={{ padding: 0, color: 'var(--copper)', fontSize: 13, display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => {
                    clearFeedback();
                    setMode('login');
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" /> Back to sign in
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

              {resetStep === 'request' && (
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
                    {loading ? 'Continuing...' : 'Continue'}
                  </button>
                  <p style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: 0, fontSize: 13, color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center' }}
                      onClick={() => {
                        clearFeedback();
                        setResetStep('otp');
                      }}
                    >
                      Already have a 6-digit code? Enter it here <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                    </button>
                  </p>
                </form>
              )}

              {resetStep === 'otp' && (
                <form onSubmit={handleVerifyOtp}>
                  <div className="field">
                    <label htmlFor="reset-token">Enter 6-Digit Code</label>
                    <input
                      id="reset-token"
                      required
                      maxLength={6}
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="------"
                      style={{
                        letterSpacing: '8px',
                        fontSize: '22px',
                        fontWeight: '700',
                        textAlign: 'center',
                        fontFamily: 'var(--mono)',
                      }}
                    />
                  </div>
                  <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                    {loading ? 'Verifying code...' : 'Verify Code'}
                  </button>
                  <p style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: 0, fontSize: 13, color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center' }}
                      onClick={() => {
                        clearFeedback();
                        setResetStep('request');
                      }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" /> Change email address
                    </button>
                  </p>
                </form>
              )}

              {resetStep === 'new-password' && (
                <form onSubmit={handleConfirmReset}>
                  <div className="field">
                    <label htmlFor="reset-new-pass">New password</label>
                    <input
                      id="reset-new-pass"
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="reset-confirm-pass">Confirm new password</label>
                    <input
                      id="reset-confirm-pass"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                    {loading ? 'Updating password...' : 'Save New Password & Sign In'}
                  </button>
                </form>
              )}

              <p style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  id="back-login"
                  style={{ padding: 0, color: 'var(--copper)', fontSize: 13, display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => {
                    clearFeedback();
                    setResetStep('request');
                    setMode('login');
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" /> Back to sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="screen is-on" style={{ padding: 48, textAlign: 'center' }}>
          <p className="hint">Loading ServiceOps secure sign-in...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
