'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RoleName } from '@/types/auth';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  const primaryRole = user?.roles[0] || RoleName.EMPLOYEE;

  // Fetch users for Admin/Manager view
  useEffect(() => {
    if (
      user?.roles.includes(RoleName.SYSTEM_ADMINISTRATOR) ||
      user?.roles.includes(RoleName.IT_MANAGER)
    ) {
      api
        .get('/users')
        .then((res) => setUsersList(res.data?.data || []))
        .catch((err) => setApiError(err?.response?.data?.message || 'Error fetching users'));
    }
  }, [user]);

  const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'P'}`;
  const roleDisplay = primaryRole.replace(/_/g, ' ');

  return (
    <ProtectedRoute>
      <div id="app" className="screen is-on" data-screen="app">
        {/* Left Navigation Rail */}
        <aside className="rail">
          <div className="rail-brand">
            <span className="mark">
              <i></i>
            </span>
            <div>
              <strong>ServiceOps</strong>
              <span>Northwind Internal IT</span>
            </div>
          </div>

          <nav id="nav" aria-label="Primary">
            {primaryRole === RoleName.EMPLOYEE && (
              <>
                <button
                  type="button"
                  aria-current={activeTab === 'home' ? 'page' : undefined}
                  onClick={() => setActiveTab('home')}
                >
                  Home
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'requests' ? 'page' : undefined}
                  onClick={() => setActiveTab('requests')}
                >
                  My Requests (3)
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'new' ? 'page' : undefined}
                  onClick={() => setActiveTab('new')}
                >
                  + New Request
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'kb' ? 'page' : undefined}
                  onClick={() => setActiveTab('kb')}
                >
                  Knowledge Base
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'assets' ? 'page' : undefined}
                  onClick={() => setActiveTab('assets')}
                >
                  My IT Assets
                </button>
              </>
            )}

            {primaryRole === RoleName.IT_SUPPORT_AGENT && (
              <>
                <button
                  type="button"
                  aria-current={activeTab === 'queue' ? 'page' : undefined}
                  onClick={() => setActiveTab('queue')}
                >
                  My Queue (7)
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'all' ? 'page' : undefined}
                  onClick={() => setActiveTab('all')}
                >
                  Unassigned Pool (3)
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'incidents' ? 'page' : undefined}
                  onClick={() => setActiveTab('incidents')}
                >
                  Major Incidents (1)
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'kb' ? 'page' : undefined}
                  onClick={() => setActiveTab('kb')}
                >
                  Knowledge Articles
                </button>
              </>
            )}

            {(primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
              <>
                <button
                  type="button"
                  aria-current={activeTab === 'overview' ? 'page' : undefined}
                  onClick={() => setActiveTab('overview')}
                >
                  Operations Overview
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'users' ? 'page' : undefined}
                  onClick={() => setActiveTab('users')}
                >
                  Enterprise Directory
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'sla' ? 'page' : undefined}
                  onClick={() => setActiveTab('sla')}
                >
                  SLA Compliance Matrix
                </button>
                <button
                  type="button"
                  aria-current={activeTab === 'incidents' ? 'page' : undefined}
                  onClick={() => setActiveTab('incidents')}
                >
                  Incident War-Room
                </button>
              </>
            )}
          </nav>

          {/* User Profile in Rail */}
          <div className="who">
            <div className="avatar" id="avatar">
              {initials}
            </div>
            <div>
              <strong id="who-name">
                {user?.firstName} {user?.lastName}
              </strong>
              <small id="who-role">
                {roleDisplay} · {user?.department || 'Operations'}
              </small>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="workspace">
          {/* Top Sticky Header */}
          <header className="top">
            <div className="search">
              <input id="q" placeholder="Search tickets, incidents, people, assets..." />
            </div>

            <div className="top-meta">
              <span className="live">
                <i></i> Desk live
              </span>
              <span>Colombo Office · 14:10</span>
              <button className="icon-btn" type="button" aria-label="Notifications">
                Inbox <span className="badge">3</span>
              </button>
              <button className="icon-btn" type="button" id="signout" onClick={() => logout()}>
                Sign out
              </button>
            </div>
          </header>

          <main>
            {/* EMPLOYEE PORTAL VIEW */}
            {primaryRole === RoleName.EMPLOYEE && (
              <section className="view">
                {/* Active Incident / Outage Alert Banner */}
                <div className="outage-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="outage-icon">⚠️</div>
                    <div>
                      <strong style={{ color: 'var(--amber)', fontSize: 14 }}>
                        Active Service Notice: Organization-wide login latency (INC-208)
                      </strong>
                      <div className="hint" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>
                        IT Operations is investigating intermittent directory delays. New password
                        and mailbox requests may take longer than usual.
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    style={{
                      whiteSpace: 'nowrap',
                      fontSize: 13,
                      padding: '6px 14px',
                      borderColor: '#d0b57e',
                    }}
                  >
                    View incident update
                  </button>
                </div>

                {/* Action Required / Confirmation Card */}
                <div className="action-card" id="home-action-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="badge-icon">✓</div>
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
                        Action Required · Confirm Resolution
                      </div>
                      <strong style={{ fontSize: 15, display: 'block', marginTop: 2 }}>
                        TKT-1022: Printer jam, 3rd floor was marked Resolved
                      </strong>
                      <p className="hint" style={{ marginTop: 2, color: 'var(--ink-soft)' }}>
                        Agent R. Chen cleared sensor B and tested 5 sample pages. Please confirm your
                        issue is resolved to close this request.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <button
                      className="btn btn-primary"
                      type="button"
                      style={{ fontSize: 13, padding: '8px 14px' }}
                    >
                      Confirm & Close
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      style={{ fontSize: 13, padding: '8px 14px' }}
                    >
                      Review ticket
                    </button>
                  </div>
                </div>

                {/* Hero Greeting & Self-Service Search Bar */}
                <div className="hero-search-box">
                  <div className="head-row" style={{ marginBottom: 14 }}>
                    <div>
                      <div className="kicker">Self-Service Portal · Colombo Office</div>
                      <h1 className="page-title" style={{ fontSize: 32 }}>
                        Good afternoon, {user?.firstName}.
                      </h1>
                      <p className="page-sub">
                        How can IT support help you today? Search knowledge guides or submit a
                        request.
                      </p>
                    </div>
                    <button className="btn btn-primary" type="button">
                      + New request
                    </button>
                  </div>

                  <div
                    className="hero-search-input-wrap"
                    style={{
                      background: 'var(--card-2)',
                      border: '1px solid var(--line-strong)',
                      borderRadius: 10,
                      padding: '8px 14px',
                    }}
                  >
                    <span style={{ fontSize: 16, color: 'var(--muted)' }}>🔍</span>
                    <input
                      id="portal-search-input"
                      placeholder="Search for self-help guides, request new equipment, report an issue..."
                    />
                    <button
                      className="btn btn-primary"
                      type="button"
                      style={{ fontSize: 13, padding: '6px 14px', whiteSpace: 'nowrap' }}
                    >
                      Search
                    </button>
                  </div>

                  <div className="quick-tags">
                    <span className="hint" style={{ margin: 0, fontWeight: 500 }}>
                      Popular requests:
                    </span>
                    <button className="quick-tag" type="button">
                      💻 Laptop dock
                    </button>
                    <button className="quick-tag" type="button">
                      🔑 Password reset
                    </button>
                    <button className="quick-tag" type="button">
                      📦 Figma license
                    </button>
                    <button className="quick-tag" type="button">
                      🌐 Office Wi-Fi
                    </button>
                    <button className="quick-tag" type="button">
                      📚 Browse 24 help guides
                    </button>
                  </div>
                </div>

                {/* Employee Stats */}
                <div className="stats">
                  <div className="stat">
                    <span>Active requests</span>
                    <strong id="stat-active-count">3</strong>
                    <em>Owned by you</em>
                  </div>
                  <div className="stat warn" id="stat-waiting-box">
                    <span>Waiting on you</span>
                    <strong id="stat-waiting-count">1</strong>
                    <em>Confirm resolution</em>
                  </div>
                  <div className="stat good">
                    <span>Resolved this month</span>
                    <strong id="stat-resolved-count">8</strong>
                    <em>Closed after confirmation</em>
                  </div>
                  <div className="stat">
                    <span>Avg. first response</span>
                    <strong>38m</strong>
                    <em>On your tickets</em>
                  </div>
                </div>

                {/* Main Dashboard Split Layout */}
                <div className="split">
                  <div className="stack">
                    {/* My Active Requests Card */}
                    <div className="card">
                      <div className="row-between" style={{ marginBottom: 12 }}>
                        <h3>Your open requests</h3>
                        <button
                          className="btn"
                          type="button"
                          style={{ padding: 0, color: 'var(--copper)', fontSize: 13 }}
                        >
                          View all 12 requests &rarr;
                        </button>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th>Ticket</th>
                            <th>Category</th>
                            <th>Assignee</th>
                            <th>Status</th>
                            <th>SLA Target</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="clickable">
                            <td>
                              <div className="mono">TKT-1042</div>
                              <div className="subject">Laptop dock not charging</div>
                            </td>
                            <td>
                              <span className="badge-tag">Hardware</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: '#3a3028',
                                    color: 'white',
                                    fontSize: 10,
                                    display: 'grid',
                                    placeItems: 'center',
                                  }}
                                >
                                  RC
                                </span>
                                <span style={{ fontSize: 13 }}>R. Chen</span>
                              </div>
                            </td>
                            <td>
                              <span className="pill progress">In progress</span>
                            </td>
                            <td>
                              <span className="pill ok">2h 10m left</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-ghost"
                                type="button"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                View
                              </button>
                            </td>
                          </tr>

                          <tr className="clickable">
                            <td>
                              <div className="mono">TKT-1031</div>
                              <div className="subject">New starter email access</div>
                            </td>
                            <td>
                              <span className="badge-tag">Access</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: '#4e3d30',
                                    color: 'white',
                                    fontSize: 10,
                                    display: 'grid',
                                    placeItems: 'center',
                                  }}
                                >
                                  NS
                                </span>
                                <span style={{ fontSize: 13 }}>N. Silva</span>
                              </div>
                            </td>
                            <td>
                              <span className="pill pending">Pending</span>
                            </td>
                            <td>
                              <span className="pill pause">Paused</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-ghost"
                                type="button"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                View
                              </button>
                            </td>
                          </tr>

                          <tr className="clickable">
                            <td>
                              <div className="mono">TKT-1022</div>
                              <div className="subject">Printer jam, 3rd floor</div>
                            </td>
                            <td>
                              <span className="badge-tag">Hardware</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: '#3a3028',
                                    color: 'white',
                                    fontSize: 10,
                                    display: 'grid',
                                    placeItems: 'center',
                                  }}
                                >
                                  RC
                                </span>
                                <span style={{ fontSize: 13 }}>R. Chen</span>
                              </div>
                            </td>
                            <td>
                              <span className="pill resolved">Resolved</span>
                            </td>
                            <td>
                              <span className="pill ok">Met</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-primary"
                                type="button"
                                style={{ padding: '4px 10px', fontSize: 12 }}
                              >
                                Confirm
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Recommended Self-Service Guides */}
                    <div className="card">
                      <div className="row-between" style={{ marginBottom: 12 }}>
                        <h3>Recommended self-service guides</h3>
                        <button
                          className="btn"
                          type="button"
                          style={{ padding: 0, color: 'var(--copper)', fontSize: 13 }}
                        >
                          Knowledge base &rarr;
                        </button>
                      </div>
                      <div className="stack">
                        <article className="article clickable">
                          <div>
                            <strong style={{ fontSize: 14 }}>
                              Troubleshooting USB-C dock charging and dual display issues
                            </strong>
                            <p className="hint">Hardware · 3 min read · Firmware 2024 update guide</p>
                          </div>
                          <span className="pill ok">Quick fix</span>
                        </article>
                        <article className="article clickable">
                          <div>
                            <strong style={{ fontSize: 14 }}>
                              Connecting to Northwind secure internal VPN (GlobalProtect)
                            </strong>
                            <p className="hint">Network · 4 min read · Remote working setup</p>
                          </div>
                          <span className="pill ok">Guide</span>
                        </article>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Service Catalog & Desk Info */}
                  <div className="stack">
                    <div className="card">
                      <h3 style={{ marginBottom: 4 }}>Request a service</h3>
                      <p className="hint" style={{ marginBottom: 12 }}>
                        Select a service line to open a tailored request form:
                      </p>
                      <div className="service-grid">
                        <button className="service-card" type="button">
                          <span className="svc-icon">💻</span>
                          <strong>Hardware</strong>
                          <span>Laptops, docks, screens</span>
                        </button>
                        <button className="service-card" type="button">
                          <span className="svc-icon">🔑</span>
                          <strong>Access</strong>
                          <span>Accounts, mail, VPN</span>
                        </button>
                        <button className="service-card" type="button">
                          <span className="svc-icon">📦</span>
                          <strong>Software</strong>
                          <span>Installs & licenses</span>
                        </button>
                        <button className="service-card" type="button">
                          <span className="svc-icon">🌐</span>
                          <strong>Network</strong>
                          <span>Wi-Fi, ethernet, outages</span>
                        </button>
                        <button className="service-card" type="button">
                          <span className="svc-icon">🏢</span>
                          <strong>Workplace</strong>
                          <span>Printers, AV, phones</span>
                        </button>
                        <button className="service-card" type="button">
                          <span className="svc-icon">🔒</span>
                          <strong>Security</strong>
                          <span>Phishing, badges, tokens</span>
                        </button>
                      </div>
                    </div>

                    <div className="card">
                      <h3>IT Support desk</h3>
                      <div style={{ marginTop: 8 }}>
                        <div className="desk-info-row">
                          <span style={{ fontSize: 16 }}>🟢</span>
                          <div>
                            <strong>Desk status: Live</strong>
                            <div className="hint">Support agents actively on duty</div>
                          </div>
                        </div>
                        <div className="desk-info-row">
                          <span style={{ fontSize: 16 }}>📍</span>
                          <div>
                            <strong>Walk-in IT Hub</strong>
                            <div className="hint">Floor 3, West Wing · Mon–Fri 08:30–17:30</div>
                          </div>
                        </div>
                        <div className="desk-info-row">
                          <span style={{ fontSize: 16 }}>📞</span>
                          <div>
                            <strong>Emergency Hotline: Ext. 4400</strong>
                            <div className="hint">For team-wide critical stops & security incidents</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="note">
                      <strong>Privacy guarantee:</strong> Internal notes between support agents never
                      appear on this portal. You only see public communications written directly for
                      you.
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* AGENT QUEUE VIEW */}
            {primaryRole === RoleName.IT_SUPPORT_AGENT && (
              <section className="view">
                <div className="pickup-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <div>
                      <strong style={{ fontSize: 14 }}>
                        3 unassigned tickets in the incoming queue
                      </strong>
                      <div className="hint" style={{ color: 'var(--ink-soft)', marginTop: 1 }}>
                        Highest priority: TKT-1038 (Critical · Network floor 4) is 26m past response
                        target.
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary" type="button" style={{ fontSize: 13 }}>
                    Claim next ticket (TKT-1038)
                  </button>
                </div>

                <div className="head-row">
                  <div>
                    <div className="kicker">Support Desk Queue · Agent {user?.firstName}</div>
                    <h1 className="page-title">Seven tickets on your desk.</h1>
                    <p className="page-sub">
                      One response target is already breached. Two resolutions fall inside the next
                      two hours.
                    </p>
                  </div>
                </div>

                <div className="stats">
                  <div className="stat">
                    <span>Assigned to you</span>
                    <strong>7</strong>
                    <em>Active backlog</em>
                  </div>
                  <div className="stat warn">
                    <span>SLA breached</span>
                    <strong>1</strong>
                    <em>Needs escalation</em>
                  </div>
                  <div className="stat">
                    <span>Due under 2 hours</span>
                    <strong>2</strong>
                    <em>Urgent resolution</em>
                  </div>
                  <div className="stat good">
                    <span>Response met today</span>
                    <strong>5 / 5</strong>
                    <em>100% compliance</em>
                  </div>
                </div>

                <div className="split-3">
                  <div className="card lane" style={{ borderTop: '3px solid var(--rose)' }}>
                    <h3>Breached (1)</h3>
                    <div className="stack" style={{ marginTop: 8 }}>
                      <div className="tcard" style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10, background: 'white' }}>
                        <div className="row-between">
                          <span className="mono">TKT-1038</span>
                          <span className="pill critical">Critical</span>
                        </div>
                        <div className="subject" style={{ marginTop: 6, fontWeight: 600 }}>VPN drops on floor 4</div>
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="pill breach">Breached 26m</span>
                          <span className="hint">Network</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card lane" style={{ borderTop: '3px solid var(--amber)' }}>
                    <h3>Due Under 2 Hours (2)</h3>
                    <div className="stack" style={{ marginTop: 8 }}>
                      <div className="tcard" style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10, background: 'white' }}>
                        <div className="row-between">
                          <span className="mono">TKT-1042</span>
                          <span className="pill progress">In progress</span>
                        </div>
                        <div className="subject" style={{ marginTop: 6, fontWeight: 600 }}>Laptop dock not charging</div>
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="pill risk">45m left</span>
                          <span className="hint">Hardware</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card lane" style={{ borderTop: '3px solid var(--moss)' }}>
                    <h3>On Track (4)</h3>
                    <div className="stack" style={{ marginTop: 8 }}>
                      <div className="tcard" style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 10, background: 'white' }}>
                        <div className="row-between">
                          <span className="mono">TKT-1031</span>
                          <span className="pill pending">Pending</span>
                        </div>
                        <div className="subject" style={{ marginTop: 6, fontWeight: 600 }}>New starter email access</div>
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="pill pause">Paused</span>
                          <span className="hint">Access</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* MANAGER / ADMIN VIEW */}
            {(primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
              <section className="view">
                <div className="head-row">
                  <div>
                    <div className="kicker">Operations Administration · {roleDisplay}</div>
                    <h1 className="page-title">Enterprise Service Delivery Center</h1>
                    <p className="page-sub">
                      Overseeing team workload, SLA thresholds, incident command, and live account
                      permissions.
                    </p>
                  </div>
                </div>

                <div className="stats">
                  <div className="stat good">
                    <span>SLA Compliance</span>
                    <strong>96.4%</strong>
                    <em>Organization-wide target: 95%</em>
                  </div>
                  <div className="stat">
                    <span>Open Incidents</span>
                    <strong>1 Major</strong>
                    <em>INC-208 active</em>
                  </div>
                  <div className="stat">
                    <span>Active Agents</span>
                    <strong>8 on duty</strong>
                    <em>Across 4 tiers</em>
                  </div>
                  <div className="stat">
                    <span>Provisioned Users</span>
                    <strong>{usersList.length || 4}</strong>
                    <em>PostgreSQL verified</em>
                  </div>
                </div>

                {/* Live Enterprise User Directory from Backend */}
                <div className="card" style={{ marginTop: 20 }}>
                  <div className="row-between" style={{ marginBottom: 14 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Enterprise User Directory (Live NestJS API)</h3>
                      <p className="hint" style={{ margin: 0 }}>
                        Protected by RBAC server guards (@Roles SYSTEM_ADMINISTRATOR, IT_MANAGER)
                      </p>
                    </div>
                    <span className="pill ok">{usersList.length} Accounts in System</span>
                  </div>

                  {apiError ? (
                    <div style={{ padding: 12, background: 'var(--rose-bg)', color: 'var(--rose)', borderRadius: 8 }}>
                      {apiError}
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Department</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((u) => (
                          <tr key={u.id} className="clickable">
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                {u.firstName} {u.lastName}
                              </div>
                              <div className="mono" style={{ color: 'var(--muted)', fontSize: 11 }}>
                                {u.email}
                              </div>
                            </td>
                            <td>{u.department || '—'}</td>
                            <td>
                              <span className="pill new">
                                {u.userRoles?.[0]?.role?.displayName || 'Role'}
                              </span>
                            </td>
                            <td>
                              <span className="pill ok">Active</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-ghost"
                                type="button"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                Edit Role
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
