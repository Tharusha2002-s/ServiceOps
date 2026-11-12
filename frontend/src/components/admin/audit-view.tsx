'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { RoleName } from '@/types/auth';

interface AuditViewProps {
  currentUser: any;
}

const MODULE_FILTERS = [
  { key: 'all', label: 'All events' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'auth', label: 'Auth & Security' },
  { key: 'users', label: 'Users & Roles' },
  { key: 'sla', label: 'SLA changes' },
  { key: 'categories', label: 'Categories' },
  { key: 'settings', label: 'Settings' },
  { key: 'incidents', label: 'Incidents' },
];

export function AuditView({ currentUser }: AuditViewProps) {
  const isAdmin = currentUser?.roles?.includes(RoleName.SYSTEM_ADMINISTRATOR);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [chainStatus, setChainStatus] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ module: moduleFilter, limit: '100' });
      if (search.trim()) q.set('search', search.trim());
      const res = await api.get(`/audit?${q.toString()}`);
      setLogs(res.data?.data?.logs || []);
      setTotalCount(res.data?.data?.totalCount || 0);
    } catch (err) {
      console.error('Failed loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, search]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleVerifyChain = async () => {
    try {
      const res = await api.get('/audit/verify');
      const d = res.data?.data;
      setChainStatus(
        d?.intact
          ? `Integrity verified (${d.checked} chained records intact)`
          : `Chain discrepancy detected at ${d?.brokenId}`,
      );
    } catch (err: any) {
      setChainStatus(err?.response?.data?.message || 'Unable to verify audit chain');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/audit/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'serviceops-audit-trail.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Export failed');
    }
  };

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Append-Only Audit Trail</div>
          <h1 className="page-title">What changed, and who did it</h1>
          <p className="page-sub">
            Sign-ins, role grants, assignments, status changes, and SLA edits. Rows are hash-chained and immutable (SRS FR-AUD-004).
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" type="button" onClick={handleVerifyChain}>
              Verify hash chain
            </button>
            <button className="btn btn-ghost" type="button" onClick={handleExportCsv}>
              Export audit log
            </button>
          </div>
        )}
      </div>

      {chainStatus && (
        <div className="banner" style={{ borderLeftColor: 'var(--moss)' }}>
          <div>
            <strong>SHA-256 Audit Verification</strong> <span>{chainStatus}</span>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => setChainStatus(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="filters" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MODULE_FILTERS.map((m) => (
            <button
              key={m.key}
              type="button"
              className="audit-filter-btn"
              aria-pressed={moduleFilter === m.key}
              onClick={() => setModuleFilter(m.key)}
            >
              {m.key === 'all' ? `${m.label} (${totalCount})` : m.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search actor, action, resource..."
          style={{ width: 230, height: 34, padding: '6px 10px', borderRadius: 8 }}
        />
      </div>

      <div className="card" style={{ padding: '8px 8px 0' }}>
        <table id="audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Checksum</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr key={row.id} className="clickable audit-row" onClick={() => setSelectedLog(row)}>
                <td className="mono">{new Date(row.createdAt).toLocaleString()}</td>
                <td>
                  <div>{row.actorName}</div>
                  <div className="mono hint">{row.actorEmail}</div>
                </td>
                <td>
                  <span className="mono">{row.action}</span>
                </td>
                <td className="mono">
                  {row.resourceType}
                  {row.resourceId ? ` · ${row.resourceId}` : ''}
                </td>
                <td className="mono hint">{row.checksum?.slice(0, 12)}...</td>
                <td>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    style={{ padding: '2px 8px', fontSize: 11 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLog(row);
                    }}
                  >
                    Inspect JSON
                  </button>
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)' }}>
                  No audit events match this filter yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className="modal-overlay open" onClick={() => setSelectedLog(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <div>
                <div className="kicker mono">{selectedLog.action}</div>
                <h3 style={{ margin: '2px 0 0' }}>
                  {selectedLog.resourceType} {selectedLog.resourceId ? `· ${selectedLog.resourceId}` : ''}
                </h3>
              </div>
              <button className="btn btn-ghost" type="button" onClick={() => setSelectedLog(null)}>
                ✕
              </button>
            </div>
            <pre className="json-viewer">
              {JSON.stringify(
                {
                  id: selectedLog.id,
                  timestamp: selectedLog.createdAt,
                  actor: `${selectedLog.actorName} <${selectedLog.actorEmail}>`,
                  ipAddress: selectedLog.ipAddress || 'internal',
                  module: selectedLog.module,
                  action: selectedLog.action,
                  beforeState: selectedLog.beforeState ?? null,
                  afterState: selectedLog.afterState ?? null,
                  checksum: selectedLog.checksum,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}

