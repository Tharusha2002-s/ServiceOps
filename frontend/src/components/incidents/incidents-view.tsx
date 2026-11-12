'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { RoleName } from '@/types/auth';

interface IncidentsViewProps {
  user: any;
  usersList: any[];
  initialIncidentNumber?: string | null;
  onOpenTicket: (ticketNumber: string) => void;
  onClearInitialIncident?: () => void;
  onIncidentChange?: () => void;
}

export function IncidentsView({
  user,
  usersList,
  initialIncidentNumber,
  onOpenTicket,
  onClearInitialIncident,
  onIncidentChange,
}: IncidentsViewProps) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Declare Incident Modal
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [decTitle, setDecTitle] = useState('');
  const [decDesc, setDecDesc] = useState('');
  const [decSeverity, setDecSeverity] = useState('CRITICAL_P1');
  const [decScope, setDecScope] = useState('All office locations');
  const [declaring, setDeclaring] = useState(false);

  // War-Room Timeline Update Composer
  const [updateMsg, setUpdateMsg] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);

  // Ticket Linking State
  const [linkTicketNum, setLinkTicketNum] = useState('');
  const [linking, setLinking] = useState(false);

  // Inline Transition Drawer (replaces window.prompt)
  const [pendingTransition, setPendingTransition] = useState<'MITIGATED' | 'MONITORING' | 'RESOLVED' | null>(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const primaryRole = user?.roles?.[0] || RoleName.EMPLOYEE;
  const isManagerOrAdmin =
    primaryRole === RoleName.IT_MANAGER || primaryRole === RoleName.SYSTEM_ADMINISTRATOR;

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents');
      setIncidents(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIncidentDetails = useCallback(async (identifier: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/incidents/${identifier}`);
      setSelectedIncident(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching incident details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (initialIncidentNumber) {
      fetchIncidentDetails(initialIncidentNumber);
    }
  }, [initialIncidentNumber, fetchIncidentDetails]);

  const handleDeclareIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decTitle.trim() || !decDesc.trim()) return;
    setDeclaring(true);
    try {
      const res = await api.post('/incidents', {
        title: decTitle,
        description: decDesc,
        severity: decSeverity,
        impactScope: decScope,
      });
      const created = res.data?.data;
      setShowDeclareModal(false);
      setDecTitle('');
      setDecDesc('');
      await fetchIncidents();
      if (onIncidentChange) onIncidentChange();
      if (created?.incidentNumber) {
        await fetchIncidentDetails(created.incidentNumber);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to declare incident');
    } finally {
      setDeclaring(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMsg.trim() || !selectedIncident) return;
    setPostingUpdate(true);
    try {
      await api.post(`/incidents/${selectedIncident.id}/updates`, {
        message: updateMsg,
      });
      setUpdateMsg('');
      await fetchIncidentDetails(selectedIncident.incidentNumber);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to post update');
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleLinkTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTicketNum.trim() || !selectedIncident) return;
    setLinking(true);
    try {
      await api.post(`/incidents/${selectedIncident.id}/link-ticket`, {
        ticketIdentifier: linkTicketNum.trim().toUpperCase(),
      });
      setLinkTicketNum('');
      await fetchIncidentDetails(selectedIncident.incidentNumber);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to link ticket. Verify ticket number (e.g. TKT-1042)');
    } finally {
      setLinking(false);
    }
  };

  const handleUpdateIncident = async (payload: any) => {
    if (!selectedIncident) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/incidents/${selectedIncident.id}`, payload);
      setPendingTransition(null);
      setTransitionNote('');
      await fetchIncidentDetails(selectedIncident.incidentNumber);
      await fetchIncidents();
      if (onIncidentChange) onIncidentChange();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update incident');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getSeverityPill = (sev: string) => {
    if (sev === 'CRITICAL_P1') return <span className="pill critical">Critical (P1)</span>;
    if (sev === 'HIGH_P2') return <span className="pill high">High (P2)</span>;
    if (sev === 'MEDIUM_P3') return <span className="pill medium">Medium</span>;
    return <span className="pill low">Low</span>;
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'INVESTIGATING':
        return <span className="pill progress">Investigating</span>;
      case 'MITIGATED':
        return <span className="pill risk">Mitigated</span>;
      case 'MONITORING':
        return <span className="pill open">Monitoring</span>;
      case 'RESOLVED':
        return <span className="pill resolved">Resolved</span>;
      default:
        return <span className="pill open">{status}</span>;
    }
  };

  const staffCommanders = usersList.filter((u) =>
    u.userRoles?.some((ur: any) =>
      ['IT_MANAGER', 'IT_SUPPORT_AGENT', 'SYSTEM_ADMINISTRATOR'].includes(ur.role?.name),
    ),
  );

  // ======================================================
  // RENDER MODE A: WAR-ROOM DETAIL VIEW
  // ======================================================
  if (selectedIncident) {
    const statusOrder = ['DECLARED', 'INVESTIGATING', 'MITIGATED', 'MONITORING', 'RESOLVED'];
    const currentIdx = statusOrder.indexOf(selectedIncident.status);

    return (
      <section className="view">
        <div className="head-row">
          <div>
            <div className="kicker mono">
              {selectedIncident.incidentNumber} · Major Incident Command
            </div>
            <h1 className="page-title">{selectedIncident.title}</h1>
            <p className="page-sub">{selectedIncident.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {getSeverityPill(selectedIncident.severity)}
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setSelectedIncident(null);
                if (onClearInitialIncident) onClearInitialIncident();
              }}
            >
              &larr; Back to incidents
            </button>
          </div>
        </div>

        {/* Incident Lifecycle Stepper */}
        <div className="incident-stepper">
          <span className="hint" style={{ fontWeight: 600 }}>Incident State:</span>
          {statusOrder.map((st, idx) => {
            const isDone = idx < currentIdx || selectedIncident.status === 'RESOLVED';
            const isActive = idx === currentIdx && selectedIncident.status !== 'RESOLVED';
            return (
              <div
                key={st}
                className={`inc-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              >
                {isDone ? '✓ ' : isActive ? '● ' : '○ '}
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </div>
            );
          })}
        </div>

        <div className="layout-ticket">
          {/* Left Column: Timeline & Linked Tickets */}
          <div className="stack">
            {/* Investigation Timeline */}
            <div className="card">
              <div className="row-between">
                <h3>Investigation timeline & updates</h3>
                <span className="hint">War-room chronological record</span>
              </div>

              <ol className="timeline" style={{ marginTop: 14 }}>
                {selectedIncident.updates?.map((u: any) => (
                  <li key={u.id}>
                    <i></i>
                    <div>
                      <strong>{u.message}</strong>
                      <div className="hint">
                        {new Date(u.createdAt).toLocaleString()} ·{' '}
                        {u.author ? `${u.author.firstName} ${u.author.lastName}` : 'System'}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Post Update Form */}
              <form
                onSubmit={handlePostUpdate}
                style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}
              >
                <label htmlFor="inc-new-update" style={{ fontWeight: 600, fontSize: 13 }}>
                  Post incident status update
                </label>
                <textarea
                  id="inc-new-update"
                  required
                  value={updateMsg}
                  onChange={(e) => setUpdateMsg(e.target.value)}
                  style={{ minHeight: 70, marginTop: 6, width: '100%' }}
                  placeholder="Add operational finding, mitigation step, or ETA update..."
                />
                <div className="row-between" style={{ marginTop: 8 }}>
                  <span className="hint">Broadcasts to all engineers and command log.</span>
                  <button className="btn btn-primary" type="submit" disabled={postingUpdate}>
                    {postingUpdate ? 'Posting...' : 'Post update'}
                  </button>
                </div>
              </form>
            </div>

            {/* Linked Service Requests */}
            <div className="card">
              <div className="row-between">
                <h3>Linked service requests ({selectedIncident.linkedTickets?.length || 0})</h3>
                <form onSubmit={handleLinkTicket} style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="e.g. TKT-1042"
                    value={linkTicketNum}
                    onChange={(e) => setLinkTicketNum(e.target.value)}
                    style={{ width: 130, padding: '4px 8px', fontSize: 12 }}
                  />
                  <button
                    className="btn btn-ghost"
                    type="submit"
                    disabled={linking}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    + Link ticket
                  </button>
                </form>
              </div>
              <p className="hint" style={{ margin: '4px 0 10px' }}>
                Affected service tickets linked to this major outage for unified tracking.
              </p>

              {selectedIncident.linkedTickets?.length === 0 ? (
                <div className="hint" style={{ padding: '16px 0' }}>
                  No service tickets linked to this incident yet.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Subject</th>
                      <th>Requester</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedIncident.linkedTickets.map((t: any) => (
                      <tr
                        key={t.id}
                        className="clickable"
                        onClick={() => onOpenTicket(t.ticketNumber)}
                      >
                        <td className="mono">{t.ticketNumber}</td>
                        <td>{t.title}</td>
                        <td>
                          {t.requester
                            ? `${t.requester.firstName} ${t.requester.lastName}`
                            : '—'}
                        </td>
                        <td>
                          <span className="pill progress">{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Sidebar: Command & Controls */}
          <aside className="stack">
            <div className="card">
              <h3>Incident Command</h3>
              <div className="meta-list" style={{ marginTop: 10 }}>
                <div>
                  <dt>Severity</dt>
                  <dd>{getSeverityPill(selectedIncident.severity)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{getStatusPill(selectedIncident.status)}</dd>
                </div>
                <div>
                  <dt>Commander</dt>
                  <dd>
                    {selectedIncident.commander
                      ? `${selectedIncident.commander.firstName} ${selectedIncident.commander.lastName}`
                      : 'Unassigned'}
                  </dd>
                </div>
                <div>
                  <dt>Reporter</dt>
                  <dd>
                    {selectedIncident.reporter
                      ? `${selectedIncident.reporter.firstName} ${selectedIncident.reporter.lastName}`
                      : 'System'}
                  </dd>
                </div>
                <div>
                  <dt>Started</dt>
                  <dd className="mono">
                    {new Date(selectedIncident.createdAt).toLocaleTimeString()}
                  </dd>
                </div>
                <div>
                  <dt>Impact</dt>
                  <dd>{selectedIncident.impactScope || 'Organization-wide'}</dd>
                </div>
              </div>

              {selectedIncident.workaround && (
                <div className="note" style={{ marginTop: 12, fontSize: 12 }}>
                  <strong>Active Workaround:</strong> {selectedIncident.workaround}
                </div>
              )}

              {selectedIncident.rootCause && (
                <div
                  className="note"
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    background: '#eef6f0',
                    borderColor: '#bcdcc4',
                  }}
                >
                  <strong>Root Cause Analysis:</strong> {selectedIncident.rootCause}
                </div>
              )}

              {/* Manager Command Controls */}
              {isManagerOrAdmin && selectedIncident.status !== 'RESOLVED' && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                  <div className="field">
                    <label htmlFor="inc-owner">Transfer Commander</label>
                    <select
                      id="inc-owner"
                      value={selectedIncident.commanderId || ''}
                      onChange={(e) => handleUpdateIncident({ commanderId: e.target.value })}
                    >
                      {staffCommanders.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="stack" style={{ marginTop: 10, gap: 6 }}>
                    {(selectedIncident.status === 'DECLARED' || selectedIncident.status === 'INVESTIGATING') && (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => {
                          setPendingTransition('MITIGATED');
                          setTransitionNote('Traffic rerouted to redundant standby cluster.');
                        }}
                      >
                        Transition to Mitigated
                      </button>
                    )}

                    {selectedIncident.status === 'MITIGATED' && (
                      <button
                        className="btn btn-primary"
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateIncident({ status: 'MONITORING' })}
                      >
                        Transition to Monitoring
                      </button>
                    )}

                    {selectedIncident.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-ghost"
                        type="button"
                        style={{ borderColor: 'var(--moss)', color: 'var(--moss)' }}
                        onClick={() => {
                          setPendingTransition('RESOLVED');
                          setTransitionNote('Resolved underlying service degradation and restored normal operations.');
                        }}
                      >
                        ✓ Mark Incident Resolved
                      </button>
                    )}
                  </div>

                  {pendingTransition && (
                    <div
                      className="card stack"
                      style={{
                        marginTop: 12,
                        background: 'var(--card-2)',
                        borderColor: pendingTransition === 'RESOLVED' ? 'var(--moss)' : 'var(--copper)',
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>
                        {pendingTransition === 'MITIGATED'
                          ? 'Document Workaround / Mitigation'
                          : 'Document Final Root Cause Analysis'}
                      </strong>
                      <textarea
                        rows={3}
                        value={transitionNote}
                        onChange={(e) => setTransitionNote(e.target.value)}
                        style={{ width: '100%', fontSize: 12, padding: 8, background: 'white' }}
                        placeholder={
                          pendingTransition === 'MITIGATED'
                            ? 'Describe temporary mitigation/workaround...'
                            : 'Document verified root cause and permanent fix...'
                        }
                      />
                      <div className="row-between">
                        <button
                          className="btn btn-ghost"
                          type="button"
                          style={{ fontSize: 12, padding: '4px 10px' }}
                          onClick={() => {
                            setPendingTransition(null);
                            setTransitionNote('');
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={updatingStatus || !transitionNote.trim()}
                          style={{ fontSize: 12, padding: '4px 12px' }}
                          onClick={() => {
                            if (pendingTransition === 'MITIGATED') {
                              handleUpdateIncident({ status: 'MITIGATED', workaround: transitionNote.trim() });
                            } else {
                              handleUpdateIncident({ status: 'RESOLVED', rootCause: transitionNote.trim() });
                            }
                          }}
                        >
                          {updatingStatus ? 'Saving...' : `Confirm ${pendingTransition}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    );
  }

  // ======================================================
  // RENDER MODE B: INCIDENTS LIST VIEW
  // ======================================================
  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Incidents Management</div>
          <h1 className="page-title">Service disruptions & outages</h1>
          <p className="page-sub">
            Unplanned outages and degradations. Major incidents collect related tickets to keep requesters informed.
          </p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setShowDeclareModal(true)}
        >
          + Declare incident
        </button>
      </div>

      <div className="card" style={{ padding: '8px 16px' }}>
        {loading && incidents.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading incidents...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Incident</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Commander</th>
                <th>Linked Tickets</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr
                  key={inc.id}
                  className="clickable"
                  onClick={() => fetchIncidentDetails(inc.incidentNumber)}
                >
                  <td>
                    <div className="mono">{inc.incidentNumber}</div>
                    <div className="subject">{inc.title}</div>
                  </td>
                  <td>{getSeverityPill(inc.severity)}</td>
                  <td>{getStatusPill(inc.status)}</td>
                  <td>
                    {inc.commander
                      ? `${inc.commander.firstName} ${inc.commander.lastName}`
                      : 'Unassigned'}
                  </td>
                  <td className="mono">{inc._count?.linkedTickets || 0}</td>
                  <td className="hint">{new Date(inc.updatedAt).toLocaleTimeString()}</td>
                  <td>
                    <button
                      className={`btn ${inc.status === 'RESOLVED' ? 'btn-ghost' : 'btn-primary'}`}
                      type="button"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                    >
                      {inc.status === 'RESOLVED' ? 'View' : 'Command room'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Declare Incident Modal */}
      {showDeclareModal && (
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
              width: 500,
              maxWidth: '92vw',
              background: 'white',
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            }}
          >
            <div className="row-between">
              <h3>Declare Major Incident</h3>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowDeclareModal(false)}
                style={{ padding: '2px 8px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeclareIncident} className="stack">
              <div className="field">
                <label>Incident Title</label>
                <input
                  type="text"
                  required
                  value={decTitle}
                  onChange={(e) => setDecTitle(e.target.value)}
                  placeholder="e.g. Core Exchange Mail Server Unreachable"
                />
              </div>

              <div className="field">
                <label>Severity Level</label>
                <select
                  value={decSeverity}
                  onChange={(e) => setDecSeverity(e.target.value)}
                >
                  <option value="CRITICAL_P1">Critical (P1) — Organization-wide Outage</option>
                  <option value="HIGH_P2">High (P2) — Department / Critical Service Down</option>
                  <option value="MEDIUM_P3">Medium (P3) — Partial Degradation</option>
                </select>
              </div>

              <div className="field">
                <label>Impact Scope</label>
                <input
                  type="text"
                  value={decScope}
                  onChange={(e) => setDecScope(e.target.value)}
                  placeholder="e.g. All office locations, VPN gateways"
                />
              </div>

              <div className="field">
                <label>Initial Investigation Summary</label>
                <textarea
                  required
                  rows={3}
                  value={decDesc}
                  onChange={(e) => setDecDesc(e.target.value)}
                  placeholder="Describe symptoms, error patterns, and affected systems..."
                />
              </div>

              <div className="row-between" style={{ marginTop: 12 }}>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setShowDeclareModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={declaring}
                  style={{ background: 'var(--rose)' }}
                >
                  {declaring ? 'Declaring...' : '🚨 Declare & Open War-Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
