'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface AgentWorkspaceProps {
  user: any;
  tickets: any[];
  activeOutage?: any | null;
  onRefresh: () => void;
  onOpenTicket: (ticketNumber: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenIncident?: (incidentNumber: string) => void;
}

export function AgentWorkspace({
  user,
  tickets,
  activeOutage,
  onRefresh,
  onOpenTicket,
  onNavigateTab,
  onOpenIncident,
}: AgentWorkspaceProps) {
  // View mode: 'lanes' | 'table'
  const [viewMode, setViewMode] = useState<'lanes' | 'table'>('lanes');
  const [claiming, setClaiming] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Filter tickets assigned to current agent
  const myTickets = tickets.filter(
    (t) => t.assigneeId === user?.id || t.assignee?.id === user?.id,
  );

  // Unassigned tickets waiting for pickup
  const unassignedTickets = tickets.filter((t) => !t.assigneeId && !t.assignee);
  const highestPriorityUnassigned = unassignedTickets.find(
    (t) => t.priority === 'CRITICAL_P1' || t.priority === 'HIGH_P2',
  ) || unassignedTickets[0];

  // Evaluate SLA state of a ticket
  const getTicketUrgencyCategory = (t: any) => {
    if (t.status === 'RESOLVED' || t.status === 'CLOSED') return 'resolved';
    if (!t.resolutionDueAt) return 'backlog';

    const now = Date.now();
    const due = new Date(t.resolutionDueAt).getTime();
    if (now > due) return 'breached';

    const leftMinutes = Math.floor((due - now) / 60000);
    if (leftMinutes <= 120) return 'urgent';

    return 'backlog';
  };

  const breachedTickets = myTickets.filter(
    (t) => getTicketUrgencyCategory(t) === 'breached',
  );
  const urgentTickets = myTickets.filter(
    (t) => getTicketUrgencyCategory(t) === 'urgent',
  );
  const backlogTickets = myTickets.filter(
    (t) => getTicketUrgencyCategory(t) === 'backlog',
  );

  // Handle self-assignment ("Claim next ticket")
  const handleClaimTicket = async (ticketId: string, ticketNumber: string) => {
    setClaiming(true);
    try {
      await api.patch(`/tickets/${ticketId}/assign`, {
        assigneeId: user.id,
      });
      await onRefresh();
      onOpenTicket(ticketNumber);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to claim ticket');
    } finally {
      setClaiming(false);
    }
  };

  const getPriorityPill = (pri: string) => {
    if (pri?.includes('P1') || pri === 'Critical') return <span className="pill critical">Critical</span>;
    if (pri?.includes('P2') || pri === 'High') return <span className="pill high">High</span>;
    if (pri?.includes('P3') || pri === 'Medium') return <span className="pill medium">Medium</span>;
    return <span className="pill low">Low</span>;
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="pill progress">In progress</span>;
      case 'PENDING_CUSTOMER':
        return <span className="pill pending">Pending</span>;
      case 'RESOLVED':
        return <span className="pill resolved">Resolved</span>;
      case 'CLOSED':
        return <span className="pill closed">Closed</span>;
      case 'NEW':
      default:
        return <span className="pill open">New</span>;
    }
  };

  const getSlaPill = (t: any) => {
    if (t.status === 'RESOLVED' || t.status === 'CLOSED') {
      return <span className="pill ok">Met ✓</span>;
    }
    if (t.status === 'PENDING_CUSTOMER') {
      return <span className="pill pause">Paused</span>;
    }
    if (!t.resolutionDueAt) return <span className="pill ok">On track</span>;

    const now = Date.now();
    const due = new Date(t.resolutionDueAt).getTime();
    if (now > due) {
      const diffMins = Math.floor((now - due) / 60000);
      return <span className="pill breach">Breached {diffMins > 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins}m`}</span>;
    }
    const leftMins = Math.floor((due - now) / 60000);
    if (leftMins <= 120) {
      return <span className="pill risk">Due in {leftMins}m</span>;
    }
    return <span className="pill ok">On track</span>;
  };

  // Filtered tickets for Table view
  const displayTickets = tickets.filter((t) => {
    if (filterStatus === 'ASSIGNED_TO_ME') return t.assigneeId === user?.id;
    if (filterStatus === 'UNASSIGNED') return !t.assigneeId;
    if (filterStatus === 'BREACHED') return getTicketUrgencyCategory(t) === 'breached';
    if (filterStatus === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    return true;
  });

  return (
    <section className="view">
      {/* 1. Active Major Incident Alert */}
      {activeOutage && (
        <div className="outage-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="outage-icon">⚠️</div>
            <div>
              <strong style={{ color: 'var(--amber)', fontSize: 14 }}>
                Major Incident Active: {activeOutage.incidentNumber} — {activeOutage.title}
              </strong>
              <div className="hint" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>
                {activeOutage.updates?.[0]?.message || activeOutage.description}
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              if (onOpenIncident) {
                onOpenIncident(activeOutage.incidentNumber);
              } else {
                onNavigateTab('incidents');
              }
            }}
            style={{ whiteSpace: 'nowrap', fontSize: 13, padding: '6px 14px', borderColor: '#d0b57e' }}
          >
            Incident command room
          </button>
        </div>
      )}

      {/* 2. Quick Pickup Banner for Unassigned Work */}
      {unassignedTickets.length > 0 && highestPriorityUnassigned && (
        <div
          className="action-card"
          style={{
            background: '#faf6ee',
            borderColor: '#e8dcbe',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--copper)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Workload Dispatch · Immediate Pickup
              </div>
              <strong style={{ fontSize: 15, display: 'block', marginTop: 2 }}>
                {unassignedTickets.length} unassigned ticket(s) in the incoming pool
              </strong>
              <p className="hint" style={{ marginTop: 2, color: 'var(--ink-soft)' }}>
                Highest priority: <strong>{highestPriorityUnassigned.ticketNumber}</strong> ({highestPriorityUnassigned.title}) — Priority: {highestPriorityUnassigned.priority}
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            disabled={claiming}
            onClick={() => handleClaimTicket(highestPriorityUnassigned.id, highestPriorityUnassigned.ticketNumber)}
            style={{ fontSize: 13, padding: '8px 16px', whiteSpace: 'nowrap' }}
          >
            {claiming ? 'Claiming...' : `Claim next (${highestPriorityUnassigned.ticketNumber})`}
          </button>
        </div>
      )}

      {/* 3. Desk Head Row & View Toggle */}
      <div className="head-row" style={{ marginBottom: 16 }}>
        <div>
          <div className="kicker">Support Desk Queue · Agent {user?.firstName} {user?.lastName}</div>
          <h1 className="page-title">{myTickets.length} tickets on your desk.</h1>
          <p className="page-sub">
            {breachedTickets.length > 0
              ? `${breachedTickets.length} response target is breached. `
              : 'All targets compliant. '}
            {urgentTickets.length} resolution(s) fall inside the next two hours.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--card-2)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 2,
            }}
          >
            <button
              type="button"
              className={`btn ${viewMode === 'lanes' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('lanes')}
              style={{ fontSize: 12, padding: '4px 12px', border: 'none' }}
            >
              Lanes
            </button>
            <button
              type="button"
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('table')}
              style={{ fontSize: 12, padding: '4px 12px', border: 'none' }}
            >
              Queue list
            </button>
          </div>
        </div>
      </div>

      {/* 4. KPI Stats Bar */}
      <div className="stats">
        <div className="stat">
          <span>Assigned to you</span>
          <strong>{myTickets.length}</strong>
          <em>Active backlog</em>
        </div>
        <div className={`stat ${breachedTickets.length > 0 ? 'warn' : ''}`}>
          <span>SLA breached</span>
          <strong style={breachedTickets.length > 0 ? { color: 'var(--rose)' } : {}}>
            {breachedTickets.length}
          </strong>
          <em>Needs escalation</em>
        </div>
        <div className="stat">
          <span>Due under 2 hours</span>
          <strong>{urgentTickets.length}</strong>
          <em>Urgent resolution</em>
        </div>
        <div className="stat good">
          <span>Unassigned Pool</span>
          <strong>{unassignedTickets.length}</strong>
          <em>Available to claim</em>
        </div>
      </div>

      {/* 5A. VIEW MODE: TRI-COLUMN URGENCY LANES */}
      {viewMode === 'lanes' && (
        <div className="split-3" style={{ marginTop: 14 }}>
          {/* Lane 1: Breached */}
          <div className="card lane" style={{ borderTop: '3px solid var(--rose)' }}>
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              Breached <span className="mono" style={{ fontSize: 12, color: 'var(--rose)' }}>{breachedTickets.length}</span>
            </h3>
            <div className="stack" style={{ marginTop: 10 }}>
              {breachedTickets.length === 0 ? (
                <div className="hint" style={{ textAlign: 'center', padding: '24px 8px' }}>
                  No breached tickets on your desk ✓
                </div>
              ) : (
                breachedTickets.map((t) => (
                  <button
                    key={t.id}
                    className="tcard"
                    type="button"
                    onClick={() => onOpenTicket(t.ticketNumber)}
                    style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
                  >
                    <div className="row-between">
                      <div className="mono" style={{ fontWeight: 600 }}>{t.ticketNumber}</div>
                      {getPriorityPill(t.priority)}
                    </div>
                    <div className="subject" style={{ marginTop: 6, fontWeight: 500, fontSize: 14 }}>
                      {t.title}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {getSlaPill(t)}
                      <span className="hint">{t.category?.name || 'General'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Lane 2: Urgent (<2 Hours) */}
          <div className="card lane" style={{ borderTop: '3px solid var(--amber)' }}>
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              Due under 2 hours <span className="mono" style={{ fontSize: 12, color: 'var(--amber)' }}>{urgentTickets.length}</span>
            </h3>
            <div className="stack" style={{ marginTop: 10 }}>
              {urgentTickets.length === 0 ? (
                <div className="hint" style={{ textAlign: 'center', padding: '24px 8px' }}>
                  No tickets due inside 2 hours
                </div>
              ) : (
                urgentTickets.map((t) => (
                  <button
                    key={t.id}
                    className="tcard"
                    type="button"
                    onClick={() => onOpenTicket(t.ticketNumber)}
                    style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
                  >
                    <div className="row-between">
                      <div className="mono" style={{ fontWeight: 600 }}>{t.ticketNumber}</div>
                      {getPriorityPill(t.priority)}
                    </div>
                    <div className="subject" style={{ marginTop: 6, fontWeight: 500, fontSize: 14 }}>
                      {t.title}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {getSlaPill(t)}
                      <span className="hint">{t.category?.name || 'General'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Lane 3: Active Backlog */}
          <div className="card lane" style={{ borderTop: '3px solid var(--copper)' }}>
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              Active Backlog <span className="mono" style={{ fontSize: 12 }}>{backlogTickets.length}</span>
            </h3>
            <div className="stack" style={{ marginTop: 10 }}>
              {backlogTickets.length === 0 ? (
                <div className="hint" style={{ textAlign: 'center', padding: '24px 8px' }}>
                  No active backlog tickets
                </div>
              ) : (
                backlogTickets.map((t) => (
                  <button
                    key={t.id}
                    className="tcard"
                    type="button"
                    onClick={() => onOpenTicket(t.ticketNumber)}
                    style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
                  >
                    <div className="row-between">
                      <div className="mono" style={{ fontWeight: 600 }}>{t.ticketNumber}</div>
                      {getPriorityPill(t.priority)}
                    </div>
                    <div className="subject" style={{ marginTop: 6, fontWeight: 500, fontSize: 14 }}>
                      {t.title}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {getSlaPill(t)}
                      <span className="hint">{t.category?.name || 'General'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5B. VIEW MODE: QUEUE LIST TABLE */}
      {viewMode === 'table' && (
        <div className="card" style={{ padding: '16px 20px', marginTop: 14 }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus('ALL')}
              style={{ fontSize: 12, padding: '3px 10px' }}
            >
              All Queue ({tickets.length})
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'ASSIGNED_TO_ME' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus('ASSIGNED_TO_ME')}
              style={{ fontSize: 12, padding: '3px 10px' }}
            >
              Assigned to me ({myTickets.length})
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'UNASSIGNED' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus('UNASSIGNED')}
              style={{ fontSize: 12, padding: '3px 10px' }}
            >
              Unassigned ({unassignedTickets.length})
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'BREACHED' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus('BREACHED')}
              style={{ fontSize: 12, padding: '3px 10px' }}
            >
              Breached ({breachedTickets.length})
            </button>
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
                <th>Assignee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayTickets.map((t) => (
                <tr key={t.id} className="clickable" onClick={() => onOpenTicket(t.ticketNumber)}>
                  <td>
                    <div className="mono">{t.ticketNumber}</div>
                    <div className="subject">{t.title}</div>
                  </td>
                  <td>{t.requester ? `${t.requester.firstName} ${t.requester.lastName}` : '—'}</td>
                  <td>
                    <span className="badge-tag">{t.category?.name || 'General'}</span>
                  </td>
                  <td>{getPriorityPill(t.priority)}</td>
                  <td>{getStatusPill(t.status)}</td>
                  <td>{getSlaPill(t)}</td>
                  <td>
                    {t.assignee ? (
                      <span style={{ fontSize: 13 }}>{t.assignee.firstName} {t.assignee.lastName}</span>
                    ) : (
                      <span className="hint" style={{ color: 'var(--amber)', fontWeight: 600 }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {!t.assigneeId ? (
                      <button
                        className="btn btn-primary"
                        type="button"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimTicket(t.id, t.ticketNumber);
                        }}
                      >
                        Claim
                      </button>
                    ) : (
                      <button
                        className="btn btn-ghost"
                        type="button"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Investigate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

