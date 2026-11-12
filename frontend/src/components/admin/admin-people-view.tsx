'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { RoleName } from '@/types/auth';

interface AdminPeopleViewProps {
  usersList: any[];
  currentUser: any;
  onRefreshUsers: () => Promise<void>;
}

const ROLE_OPTIONS: Array<{ value: RoleName; label: string }> = [
  { value: RoleName.EMPLOYEE, label: 'Employee' },
  { value: RoleName.IT_SUPPORT_AGENT, label: 'IT Support Agent' },
  { value: RoleName.IT_MANAGER, label: 'IT Manager' },
  { value: RoleName.SYSTEM_ADMINISTRATOR, label: 'System Administrator' },
];

export function AdminPeopleView({
  usersList,
  currentUser,
  onRefreshUsers,
}: AdminPeopleViewProps) {
  const isAdmin = currentUser?.roles?.includes(RoleName.SYSTEM_ADMINISTRATOR);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirst, setInviteFirst] = useState('');
  const [inviteLast, setInviteLast] = useState('');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteTitle, setInviteTitle] = useState('');
  const [invitePassword, setInvitePassword] = useState('Password@123');
  const [inviteRole, setInviteRole] = useState<RoleName>(RoleName.IT_SUPPORT_AGENT);
  const [saving, setSaving] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<RoleName>(RoleName.EMPLOYEE);

  const countByRole = (role: RoleName) =>
    usersList.filter((u) => u.userRoles?.some((ur: any) => ur.role?.name === role)).length;
  const lockedCount = usersList.filter((u) => u.status === 'LOCKED' || u.status === 'SUSPENDED').length;

  const filtered = usersList.filter((u) => {
    if (roleFilter === 'LOCKED') return u.status === 'LOCKED' || u.status === 'SUSPENDED' || u.status === 'DEACTIVATED';
    if (roleFilter === 'ALL') return true;
    return u.userRoles?.some((ur: any) => ur.role?.name === roleFilter);
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', {
        email: inviteEmail,
        firstName: inviteFirst,
        lastName: inviteLast,
        department: inviteDept || undefined,
        jobTitle: inviteTitle || undefined,
        password: invitePassword,
        role: inviteRole,
      });
      setShowInvite(false);
      setInviteEmail('');
      setInviteFirst('');
      setInviteLast('');
      setInviteDept('');
      setInviteTitle('');
      await onRefreshUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to provision user account');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (userId: string, nextStatus: string) => {
    setSaving(true);
    try {
      await api.patch(`/users/${userId}/status`, { status: nextStatus });
      await onRefreshUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update account status');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.patch(`/users/${editingUser.id}/role`, { role: editRole });
      setEditingUser(null);
      await onRefreshUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update user role');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    if (role === RoleName.IT_SUPPORT_AGENT) return { background: '#e5f0ea', color: 'var(--moss)' };
    if (role === RoleName.IT_MANAGER) return { background: '#f8efd8', color: 'var(--amber)' };
    if (role === RoleName.SYSTEM_ADMINISTRATOR) return { background: '#f3e6dc', color: 'var(--copper)' };
    return {};
  };

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Access &amp; Identity Management</div>
          <h1 className="page-title">Accounts and roles</h1>
          <p className="page-sub">
            Self-registrations receive Employee by default (BR-001). Only System Administrators can provision privileged roles or unlock accounts.
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            type="button"
            id="btn-invite-person-people"
            onClick={() => setShowInvite(true)}
          >
            + Invite person
          </button>
        )}
      </div>

      <div className="filters" id="people-role-filters">
        {[
          { key: 'ALL', label: `All accounts (${usersList.length})` },
          { key: RoleName.EMPLOYEE, label: `Employees (${countByRole(RoleName.EMPLOYEE)})` },
          { key: RoleName.IT_SUPPORT_AGENT, label: `Agents (${countByRole(RoleName.IT_SUPPORT_AGENT)})` },
          { key: RoleName.IT_MANAGER, label: `Managers (${countByRole(RoleName.IT_MANAGER)})` },
          { key: RoleName.SYSTEM_ADMINISTRATOR, label: `Admins (${countByRole(RoleName.SYSTEM_ADMINISTRATOR)})` },
          { key: 'LOCKED', label: `Locked / Suspended (${lockedCount})` },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            className="people-filter-btn"
            aria-pressed={roleFilter === f.key}
            onClick={() => setRoleFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '8px 8px 0' }}>
        <table id="people-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const roleObj = u.userRoles?.[0]?.role;
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className="person-row">
                  <td>
                    <strong>{u.firstName} {u.lastName}</strong>
                    {u.jobTitle && <div className="hint">{u.jobTitle}</div>}
                  </td>
                  <td className="mono">{u.email}</td>
                  <td>{u.department || '—'}</td>
                  <td>
                    <span className="badge-tag" style={getRoleBadgeStyle(roleObj?.name)}>
                      {roleObj?.displayName || 'Employee'}
                    </span>
                  </td>
                  <td>
                    {u.status === 'ACTIVE' ? (
                      <span className="pill ok">Active</span>
                    ) : u.status === 'LOCKED' ? (
                      <span className="pill breach">Locked</span>
                    ) : (
                      <span className="pill risk">{u.status}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-ghost"
                          type="button"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => {
                            setEditingUser(u);
                            setEditRole(roleObj?.name || RoleName.EMPLOYEE);
                          }}
                        >
                          Edit role
                        </button>
                        {u.status === 'LOCKED' ? (
                          <button
                            className="btn btn-primary"
                            type="button"
                            disabled={saving}
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                          >
                            Unlock
                          </button>
                        ) : u.status === 'ACTIVE' ? (
                          !isSelf && (
                            <button
                              className="btn btn-ghost"
                              type="button"
                              disabled={saving}
                              style={{ padding: '4px 8px', fontSize: 12, color: 'var(--rose)' }}
                              onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                            >
                              Suspend
                            </button>
                          )
                        ) : (
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={saving}
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)' }}>
                  No accounts match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div className="modal-overlay open" onClick={() => setShowInvite(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Provision Enterprise Account</h3>
              <button className="btn btn-ghost" type="button" onClick={() => setShowInvite(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleInvite} className="stack">
              <div className="grid-2">
                <div className="field">
                  <label>First name</label>
                  <input required value={inviteFirst} onChange={(e) => setInviteFirst(e.target.value)} />
                </div>
                <div className="field">
                  <label>Last name</label>
                  <input required value={inviteLast} onChange={(e) => setInviteLast(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Work email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@serviceops.local"
                />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Department</label>
                  <input value={inviteDept} onChange={(e) => setInviteDept(e.target.value)} placeholder="IT Operations" />
                </div>
                <div className="field">
                  <label>Job title</label>
                  <input value={inviteTitle} onChange={(e) => setInviteTitle(e.target.value)} placeholder="Support Analyst" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as RoleName)}>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Initial password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="row-between" style={{ marginTop: 8 }}>
                <button className="btn btn-ghost" type="button" onClick={() => setShowInvite(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Provisioning...' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay open" onClick={() => setEditingUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Edit Role Assignment</h3>
              <button className="btn btn-ghost" type="button" onClick={() => setEditingUser(null)}>
                ✕
              </button>
            </div>
            <p className="hint" style={{ marginBottom: 14 }}>
              Account: <strong>{editingUser.firstName} {editingUser.lastName}</strong> ({editingUser.email})
            </p>
            <div className="field">
              <label>Assigned Role</label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as RoleName)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="row-between" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" disabled={saving} onClick={handleRoleSave}>
                {saving ? 'Saving...' : 'Update role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

