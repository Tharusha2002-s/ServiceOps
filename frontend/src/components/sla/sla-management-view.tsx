'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface SlaManagementViewProps {
  policies: any[];
  metrics: any;
  breachedTickets: any[];
  onRefresh: () => void;
  onOpenTicket: (ticketNumber: string) => void;
}

export function SlaManagementView({
  policies,
  metrics,
  breachedTickets,
  onRefresh,
  onOpenTicket,
}: SlaManagementViewProps) {
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formResponseMinutes, setFormResponseMinutes] = useState(60);
  const [formResolutionMinutes, setFormResolutionMinutes] = useState(480);
  const [formWarningPct, setFormWarningPct] = useState(75);
  const [formBusinessHours, setFormBusinessHours] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const startEditPolicy = (policy: any) => {
    setEditingPolicy(policy);
    setFormName(policy.name || '');
    setFormResponseMinutes(policy.responseTargetMinutes);
    setFormResolutionMinutes(policy.resolutionTargetMinutes);
    setFormWarningPct(policy.warningThresholdPct || 75);
    setFormBusinessHours(policy.businessHoursOnly);
    setFeedback(null);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    setSaving(true);
    setFeedback(null);
    try {
      await api.post('/sla/policies', {
        name: formName,
        priority: editingPolicy.priority,
        responseTargetMinutes: Number(formResponseMinutes),
        resolutionTargetMinutes: Number(formResolutionMinutes),
        warningThresholdPct: Number(formWarningPct),
        businessHoursOnly: formBusinessHours,
      });
      setFeedback(`SLA Policy for ${editingPolicy.priority} updated successfully!`);
      setEditingPolicy(null);
      onRefresh();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'Failed to update SLA policy');
    } finally {
      setSaving(false);
    }
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours} hours`;
  };

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Service Level Agreements</div>
          <h1 className="page-title">Response and resolution targets</h1>
          <p className="page-sub">
            Policies match priority conditions. Business hours are weekdays, 08:00 to 18:00. Pending status pauses the clock.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onRefresh}
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            ↻ Refresh Metrics
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className="note"
          style={{
            marginBottom: 16,
            background: '#eef6f0',
            borderColor: '#bcdcc4',
            color: 'var(--moss)',
            fontWeight: 500,
          }}
        >
          ✓ {feedback}
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="stats">
        <div className={`stat ${metrics?.complianceRatePct >= 90 ? 'good' : 'warn'}`}>
          <span>SLA Compliance</span>
          <strong>{metrics?.complianceRatePct ?? 100}%</strong>
          <em>Target: 95% threshold</em>
        </div>
        <div className="stat">
          <span>Total Monitored</span>
          <strong>{metrics?.totalEvaluated ?? 0}</strong>
          <em>Running snapshots</em>
        </div>
        <div className="stat good">
          <span>Target Met</span>
          <strong>{metrics?.metCount ?? 0}</strong>
          <em>Compliant resolutions</em>
        </div>
        <div className={`stat ${metrics?.breachedCount > 0 ? 'warn' : ''}`}>
          <span>SLA Breached</span>
          <strong style={metrics?.breachedCount > 0 ? { color: 'var(--rose)' } : {}}>
            {metrics?.breachedCount ?? 0}
          </strong>
          <em>Needs escalation</em>
        </div>
        <div className="stat">
          <span>Clock Paused</span>
          <strong>{metrics?.pausedCount ?? 0}</strong>
          <em>Pending customer</em>
        </div>
      </div>

      {/* Breached Tickets Escalation Lane */}
      {breachedTickets.length > 0 && (
        <div
          className="card lane"
          style={{
            borderTop: '4px solid var(--rose)',
            marginBottom: 20,
            background: '#fffbfb',
          }}
        >
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--rose)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                ⚠️ Immediate Attention Required · Breach Escalation
              </div>
              <h3 style={{ margin: '4px 0 0' }}>
                {breachedTickets.length} ticket(s) currently past SLA deadline
              </h3>
            </div>
            <span className="pill breach">{breachedTickets.length} Breached</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Requester</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA Deadline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {breachedTickets.map((t) => (
                <tr key={t.id} className="clickable" onClick={() => onOpenTicket(t.ticketNumber)}>
                  <td>
                    <div className="mono">{t.ticketNumber}</div>
                    <div className="subject">{t.title}</div>
                  </td>
                  <td>
                    {t.requester ? `${t.requester.firstName} ${t.requester.lastName}` : '—'}
                  </td>
                  <td>{t.category?.name || 'General'}</td>
                  <td>
                    <span className="pill critical">{t.priority}</span>
                  </td>
                  <td>
                    <span className="pill open">{t.status}</span>
                  </td>
                  <td>
                    <span className="pill breach">Breached</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      type="button"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTicket(t.ticketNumber);
                      }}
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Policy Table */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <h3 style={{ marginBottom: 14 }}>Organizational SLA Policy Tiers</h3>
        <div
          className="policy"
          style={{
            color: 'var(--muted)',
            fontSize: 12,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <span>Policy condition</span>
          <span>First response</span>
          <span>Resolution target</span>
          <span>Status & Actions</span>
        </div>

        {policies.map((p) => {
          const isCritical = p.priority === 'CRITICAL_P1';
          const isHigh = p.priority === 'HIGH_P2';
          const isMedium = p.priority === 'MEDIUM_P3';

          const label = isCritical
            ? 'Critical (P1)'
            : isHigh
            ? 'High (P2)'
            : isMedium
            ? 'Medium (P3)'
            : 'Low (P4)';

          return (
            <div key={p.id} className="policy">
              <div>
                <strong>{label}</strong>
                <div className="hint">{p.name || p.description}</div>
                <div className="hint" style={{ fontSize: 11, marginTop: 2 }}>
                  Calendar: {p.businessHoursOnly ? 'Weekdays 08:00–18:00' : '24x7 Emergency'} · Warning threshold: {p.warningThresholdPct || 75}%
                </div>
              </div>
              <span className="mono" style={{ fontWeight: 600 }}>
                {formatMinutes(p.responseTargetMinutes)}
              </span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {formatMinutes(p.resolutionTargetMinutes)} {p.businessHoursOnly ? 'business hrs' : 'elapsed'}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="pill ok">Active (v1.0)</span>
                <button
                  className="btn btn-ghost"
                  type="button"
                  style={{ fontSize: 12, padding: '3px 8px' }}
                  onClick={() => startEditPolicy(p)}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Policy Edit Modal / Drawer */}
      {editingPolicy && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 25, 21, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            className="card stack"
            style={{
              width: 480,
              maxWidth: '90vw',
              background: 'white',
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            }}
          >
            <div className="row-between">
              <h3>Edit SLA Policy: {editingPolicy.priority}</h3>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setEditingPolicy(null)}
                style={{ padding: '2px 8px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="stack">
              <div className="field">
                <label>Policy Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="field">
                <label>First Response Target (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  required
                  value={formResponseMinutes}
                  onChange={(e) => setFormResponseMinutes(Number(e.target.value))}
                />
                <span className="hint">Equivalent to: {formatMinutes(formResponseMinutes)}</span>
              </div>

              <div className="field">
                <label>Resolution Target (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  required
                  value={formResolutionMinutes}
                  onChange={(e) => setFormResolutionMinutes(Number(e.target.value))}
                />
                <span className="hint">Equivalent to: {formatMinutes(formResolutionMinutes)}</span>
              </div>

              <div className="field">
                <label>Warning Alert Threshold (%)</label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  required
                  value={formWarningPct}
                  onChange={(e) => setFormWarningPct(Number(e.target.value))}
                />
                <span className="hint">
                  Tickets trigger &lsquo;AT_RISK&rsquo; warning state when {formWarningPct}% of deadline has elapsed.
                </span>
              </div>

              <div className="field">
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formBusinessHours}
                    onChange={(e) => setFormBusinessHours(e.target.checked)}
                  />
                  <span>Enforce Business Hours Only (08:00–18:00 Mon–Fri)</span>
                </label>
              </div>

              <div className="row-between" style={{ marginTop: 16 }}>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save & Publish Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immutable Snapshot Rule BR-008 Notice */}
      <div className="note" style={{ marginTop: 16 }}>
        <strong>Immutable Snapshot Rule BR-008:</strong> When an SLA target is edited, it creates the next version. Running tickets keep the policy snapshot they were given at creation so historical compliance reports are never rewritten.
      </div>
    </section>
  );
}

