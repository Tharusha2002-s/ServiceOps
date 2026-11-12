'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface DispatchDeskProps {
  tickets: any[];
  agents: any[];
  onRefresh: () => void;
  onOpenTicket: (ticketNumber: string) => void;
}

export function DispatchDesk({
  tickets,
  agents,
  onRefresh,
  onOpenTicket,
}: DispatchDeskProps) {
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [autoBalancing, setAutoBalancing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Soft-cap capacity per agent
  const CAPACITY_LIMIT = 5;

  // Unassigned tickets sorted by priority urgency
  const unassignedTickets = tickets
    .filter((t) => !t.assigneeId && !t.assignee && t.status !== 'CLOSED' && t.status !== 'RESOLVED')
    .sort((a, b) => {
      const pOrder: Record<string, number> = {
        CRITICAL_P1: 1,
        HIGH_P2: 2,
        MEDIUM_P3: 3,
        LOW_P4: 4,
      };
      return (pOrder[a.priority] || 5) - (pOrder[b.priority] || 5);
    });

  // Calculate workload per agent
  const supportAgents = agents.filter((u) =>
    u.userRoles?.some((ur: any) => ur.role?.name === 'IT_SUPPORT_AGENT' || ur.role?.name === 'IT_MANAGER'),
  );

  const getAgentActiveTickets = (agentId: string) => {
    return tickets.filter(
      (t) =>
        (t.assigneeId === agentId || t.assignee?.id === agentId) &&
        t.status !== 'CLOSED' &&
        t.status !== 'RESOLVED',
    );
  };

  // Manual Assignment
  const handleAssign = async (ticketId: string, agentId: string) => {
    if (!ticketId || !agentId) return;
    setAssigning(true);
    setFeedback(null);
    try {
      await api.patch(`/tickets/${ticketId}/assign`, { assigneeId: agentId });
      const assignedAgent = supportAgents.find((a) => a.id === agentId);
      setFeedback(`Ticket assigned successfully to ${assignedAgent?.firstName} ${assignedAgent?.lastName}!`);
      setSelectedTicket(null);
      setTargetAgentId('');
      await onRefresh();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setAssigning(false);
    }
  };

  // Auto-Balance Algorithm
  const handleAutoBalance = async () => {
    if (unassignedTickets.length === 0) {
      alert('No unassigned tickets to balance!');
      return;
    }
    if (supportAgents.length === 0) {
      alert('No active support agents available!');
      return;
    }

    setAutoBalancing(true);
    setFeedback(null);
    let assignedCount = 0;

    try {
      // Clone agent workloads for balancing simulation
      const agentLoads = supportAgents.map((a) => ({
        id: a.id,
        name: `${a.firstName} ${a.lastName}`,
        count: getAgentActiveTickets(a.id).length,
      }));

      for (const tkt of unassignedTickets) {
        // Find agent with lowest active ticket count
        agentLoads.sort((a, b) => a.count - b.count);
        const bestAgent = agentLoads[0];

        await api.patch(`/tickets/${tkt.id}/assign`, { assigneeId: bestAgent.id });
        bestAgent.count++;
        assignedCount++;
      }

      setFeedback(`⚡ Successfully auto-balanced ${assignedCount} ticket(s) across support desk agents!`);
      await onRefresh();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'Error during auto-balance');
    } finally {
      setAutoBalancing(false);
    }
  };

  const getPriorityPill = (pri: string) => {
    if (pri?.includes('P1') || pri === 'Critical') return <span className="pill critical">Critical</span>;
    if (pri?.includes('P2') || pri === 'High') return <span className="pill high">High</span>;
    if (pri?.includes('P3') || pri === 'Medium') return <span className="pill medium">Medium</span>;
    return <span className="pill low">Low</span>;
  };

  const getSlaUrgencyBadge = (t: any) => {
    if (!t.resolutionDueAt) return <span className="hint">No target</span>;
    const now = Date.now();
    const due = new Date(t.resolutionDueAt).getTime();
    if (now > due) {
      const diffMins = Math.floor((now - due) / 60000);
      return <span className="pill breach">{diffMins > 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins}m`} past target</span>;
    }
    const leftMins = Math.floor((due - now) / 60000);
    if (leftMins <= 120) {
      return <span className="pill risk">{leftMins}m left</span>;
    }
    return <span className="pill ok">On track</span>;
  };

  return (
    <section className="view">
      {/* 1. Header Row */}
      <div className="head-row">
        <div>
          <div className="kicker">Assignment & Routing · Operations Desk</div>
          <h1 className="page-title">Give every open ticket an owner.</h1>
          <p className="page-sub">
            Unassigned work sits on the left. Capacity sits on the right so tickets do not land on overloaded agents.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            type="button"
            disabled={autoBalancing || unassignedTickets.length === 0}
            onClick={handleAutoBalance}
            style={{ fontSize: 13, padding: '7px 16px' }}
          >
            {autoBalancing ? 'Balancing workloads...' : '⚡ Auto-balance workload'}
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

      {/* 2. Split Workspace */}
      <div className="split">
        {/* Left Column: Unassigned Backlog */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>
              Unassigned Backlog ·{' '}
              <span className="mono" style={{ color: 'var(--copper)' }}>
                {unassignedTickets.length}
              </span>
            </h3>
            <span className="hint">Ordered by SLA urgency</span>
          </div>

          {unassignedTickets.length === 0 ? (
            <div className="hint" style={{ textAlign: 'center', padding: '40px 10px' }}>
              All tickets are currently assigned to owners ✓
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Priority</th>
                  <th>SLA Urgency</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {unassignedTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="clickable"
                    onClick={() => onOpenTicket(t.ticketNumber)}
                    style={selectedTicket?.id === t.id ? { background: '#f5eee6' } : {}}
                  >
                    <td>
                      <div className="mono">{t.ticketNumber}</div>
                      <div className="subject">{t.title}</div>
                      <div className="hint">{t.category?.name || 'General'}</div>
                    </td>
                    <td>{getPriorityPill(t.priority)}</td>
                    <td>{getSlaUrgencyBadge(t)}</td>
                    <td>
                      <button
                        className={`btn ${selectedTicket?.id === t.id ? 'btn-primary' : 'btn-ghost'}`}
                        type="button"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                          if (supportAgents.length > 0) {
                            setTargetAgentId(supportAgents[0].id);
                          }
                        }}
                      >
                        {selectedTicket?.id === t.id ? 'Selected' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column: Support Agent Capacity Roster */}
        <div className="stack">
          {/* Quick Assign Popover if ticket selected */}
          {selectedTicket && (
            <div
              className="card stack"
              style={{
                background: '#faf6ee',
                borderColor: 'var(--copper)',
                borderWidth: 2,
              }}
            >
              <div className="row-between">
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--copper)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    Assigning Ticket
                  </div>
                  <strong>
                    {selectedTicket.ticketNumber}: {selectedTicket.title}
                  </strong>
                </div>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  style={{ padding: '2px 8px' }}
                >
                  ✕
                </button>
              </div>

              <div className="field">
                <label>Select Target Agent</label>
                <select
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px' }}
                >
                  {supportAgents.map((a) => {
                    const activeCount = getAgentActiveTickets(a.id).length;
                    return (
                      <option key={a.id} value={a.id}>
                        {a.firstName} {a.lastName} ({activeCount} / {CAPACITY_LIMIT} active)
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                className="btn btn-primary"
                type="button"
                disabled={assigning || !targetAgentId}
                onClick={() => handleAssign(selectedTicket.id, targetAgentId)}
                style={{ width: '100%', fontSize: 13, padding: '8px 14px' }}
              >
                {assigning ? 'Dispatching...' : 'Dispatch Ticket to Agent'}
              </button>
            </div>
          )}

          {/* Capacity Rosters */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3>Agent Workload Capacities</h3>
              <span className="hint">Soft-cap: {CAPACITY_LIMIT} tickets / agent</span>
            </div>

            <div className="stack" style={{ gap: 12 }}>
              {supportAgents.map((agent) => {
                const activeTickets = getAgentActiveTickets(agent.id);
                const loadPct = Math.min(100, Math.round((activeTickets.length / CAPACITY_LIMIT) * 100));
                const isOverloaded = activeTickets.length >= CAPACITY_LIMIT;
                const isNearCap = activeTickets.length === CAPACITY_LIMIT - 1;

                return (
                  <div
                    key={agent.id}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      background: 'white',
                    }}
                  >
                    <div className="row-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: '#3a3028',
                            color: 'white',
                            fontSize: 12,
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 600,
                          }}
                        >
                          {agent.firstName[0]}{agent.lastName[0]}
                        </div>
                        <div>
                          <strong>{agent.firstName} {agent.lastName}</strong>
                          <div className="hint" style={{ fontSize: 11 }}>{agent.email}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          className={`pill ${
                            isOverloaded ? 'critical' : isNearCap ? 'risk' : 'ok'
                          }`}
                          style={{ fontSize: 11 }}
                        >
                          {activeTickets.length} / {CAPACITY_LIMIT} tickets
                        </span>
                        <div className="hint" style={{ fontSize: 11, marginTop: 2 }}>
                          {isOverloaded ? 'At Capacity' : isNearCap ? 'Near Cap' : 'Available'}
                        </div>
                      </div>
                    </div>

                    {/* Workload Progress Bar */}
                    <div
                      style={{
                        height: 6,
                        background: '#e7e1d6',
                        borderRadius: 99,
                        overflow: 'hidden',
                        marginTop: 10,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${loadPct}%`,
                          background: isOverloaded
                            ? 'var(--rose)'
                            : isNearCap
                            ? 'var(--amber)'
                            : 'var(--moss)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    {/* Quick Assign Action */}
                    {selectedTicket && !isOverloaded && (
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => handleAssign(selectedTicket.id, agent.id)}
                        style={{
                          marginTop: 8,
                          width: '100%',
                          fontSize: 11,
                          padding: '3px 8px',
                          color: 'var(--copper)',
                        }}
                      >
                        Assign {selectedTicket.ticketNumber} to {agent.firstName} &rarr;
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

