'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export function SettingsView() {
  const [panel, setPanel] = useState<'general' | 'security' | 'email' | 'backups'>('general');
  const [form, setForm] = useState<any>({
    orgName: 'Northwind Internal IT',
    timezone: 'Asia/Colombo',
    retentionPolicy: 'Keep active for 24 months, then archive to cold storage',
    minPasswordLength: 8,
    maxFailedLogins: 5,
    refreshRotation: 'Enabled (Detect reuse and revoke session)',
    smtpHost: 'smtp.serviceops.local',
    smtpFrom: 'no-reply@serviceops.local',
    smtpEncryption: 'STARTTLS (Port 587)',
    lastBackupAt: null,
    lastBackupSummary: null,
  });
  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.data) setForm(res.data.data);
    } catch (err) {
      console.error('Failed loading platform settings:', err);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setStatusNote(null);
    try {
      const res = await api.patch('/settings', {
        orgName: form.orgName,
        timezone: form.timezone,
        retentionPolicy: form.retentionPolicy,
        minPasswordLength: Number(form.minPasswordLength),
        maxFailedLogins: Number(form.maxFailedLogins),
        refreshRotation: form.refreshRotation,
        smtpHost: form.smtpHost,
        smtpFrom: form.smtpFrom,
        smtpEncryption: form.smtpEncryption,
      });
      setForm(res.data?.data);
      setStatusNote('Platform configuration saved to PostgreSQL & recorded in the Audit Trail.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed saving platform settings');
    } finally {
      setSaving(false);
    }
  };

  const handleManualBackup = async () => {
    setSaving(true);
    setStatusNote(null);
    try {
      const res = await api.post('/settings/backup', {});
      setForm(res.data?.data);
      setStatusNote(res.data?.data?.lastBackupSummary || 'Backup snapshot recorded.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Backup trigger failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Platform Administration</div>
          <h1 className="page-title">Organization settings &amp; policies</h1>
          <p className="page-sub">
            Global configuration for ServiceOps IT. Timezone, authentication boundaries, email delivery, and backups.
          </p>
        </div>
        <button className="btn btn-primary" type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save all settings'}
        </button>
      </div>

      {statusNote && (
        <div className="banner" style={{ borderLeftColor: 'var(--moss)' }}>
          <div>
            <strong>Saved</strong> <span>{statusNote}</span>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => setStatusNote(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="setting-tabs">
        {[
          { key: 'general', label: 'General & Timezone' },
          { key: 'security', label: 'Security & Auth (RBAC)' },
          { key: 'email', label: 'Email & Outbound SMTP' },
          { key: 'backups', label: 'Backups & Recovery' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`setting-tab ${panel === t.key ? 'active' : ''}`}
            onClick={() => setPanel(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="split">
        <div className="card stack">
          {panel === 'general' && (
            <div className="setting-panel active">
              <div className="field">
                <label>Organization name</label>
                <input
                  value={form.orgName || ''}
                  onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Timezone</label>
                <input
                  value={form.timezone || ''}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Ticket retention policy</label>
                <select
                  value={form.retentionPolicy || ''}
                  onChange={(e) => setForm({ ...form, retentionPolicy: e.target.value })}
                >
                  <option>Keep active for 24 months, then archive to cold storage</option>
                  <option>Keep indefinitely</option>
                </select>
              </div>
            </div>
          )}

          {panel === 'security' && (
            <div className="setting-panel active">
              <div className="field">
                <label>Minimum password length</label>
                <input
                  type="number"
                  min={8}
                  max={64}
                  value={form.minPasswordLength ?? 8}
                  onChange={(e) => setForm({ ...form, minPasswordLength: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Failed sign-in attempt lock threshold</label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={form.maxFailedLogins ?? 5}
                  onChange={(e) => setForm({ ...form, maxFailedLogins: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Password hashing algorithm</label>
                <input value="Argon2id (OWASP recommended)" readOnly style={{ background: 'var(--card-2)' }} />
              </div>
              <div className="field">
                <label>Refresh token rotation</label>
                <select
                  value={form.refreshRotation || ''}
                  onChange={(e) => setForm({ ...form, refreshRotation: e.target.value })}
                >
                  <option>Enabled (Detect reuse and revoke session)</option>
                  <option>Strict single-session rotation</option>
                </select>
              </div>
            </div>
          )}

          {panel === 'email' && (
            <div className="setting-panel active">
              <div className="field">
                <label>SMTP Host</label>
                <input
                  value={form.smtpHost || ''}
                  onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Notification sender email address</label>
                <input
                  value={form.smtpFrom || ''}
                  onChange={(e) => setForm({ ...form, smtpFrom: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Encryption</label>
                <select
                  value={form.smtpEncryption || ''}
                  onChange={(e) => setForm({ ...form, smtpEncryption: e.target.value })}
                >
                  <option>STARTTLS (Port 587)</option>
                  <option>SSL/TLS (Port 465)</option>
                </select>
              </div>
            </div>
          )}

          {panel === 'backups' && (
            <div className="setting-panel active">
              <div className="meta-list" style={{ marginBottom: 14 }}>
                <div>
                  <dt>Last verified snapshot</dt>
                  <dd>{form.lastBackupAt ? new Date(form.lastBackupAt).toLocaleString() : 'Not run yet'}</dd>
                </div>
                <div>
                  <dt>Last snapshot summary</dt>
                  <dd>{form.lastBackupSummary || 'PostgreSQL logical checksum ready'}</dd>
                </div>
                <div>
                  <dt>Automated schedule</dt>
                  <dd>Daily at 04:00 ({form.timezone || 'Asia/Colombo'})</dd>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={saving}
                onClick={handleManualBackup}
              >
                {saving ? 'Verifying...' : 'Trigger manual backup snapshot'}
              </button>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="note">
            <strong>Credential safety guarantee:</strong> Passwords, refresh tokens, and raw SMTP secrets are never displayed in client forms and automatically redacted (`[REDACTED]`) before entering the audit log.
          </div>
        </div>
      </div>
    </section>
  );
}

