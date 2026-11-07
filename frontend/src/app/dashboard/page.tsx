'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { RoleName } from '@/types/auth';
import { api } from '@/lib/api';
import {
  Ticket,
  AlertTriangle,
  Clock,
  Layers,
  Database,
  ShieldCheck,
  Users,
  CheckCircle,
  FileText,
  Key,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const primaryRole = user?.roles[0] || RoleName.EMPLOYEE;

  // Test fetching protected /users endpoint (Admin / Manager only)
  useEffect(() => {
    if (
      user?.roles.includes(RoleName.SYSTEM_ADMINISTRATOR) ||
      user?.roles.includes(RoleName.IT_MANAGER)
    ) {
      api
        .get('/users')
        .then((res) => {
          setUsersList(res.data?.data || []);
        })
        .catch((err) => {
          setApiError(err?.response?.data?.message || 'Failed to fetch user directory');
        });
    }
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {/* Welcome Banner */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider text-brand-400">
                  {primaryRole.replace(/_/g, ' ')} Workspace
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Department: <span className="text-slate-300 font-medium">{user?.department || 'General IT'}</span> • Title: <span className="text-slate-300 font-medium">{user?.jobTitle || 'Staff Member'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Session Active (15m Rotation)</span>
              </div>
            </div>
          </div>

          {/* Module 1 RBAC Security Matrix Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Identity & Token Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Authenticated Identity</h3>
                  <p className="text-xs text-slate-400">JWT Claims & Lifecycle</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">User ID</span>
                  <span className="font-mono text-slate-200">{user?.id.slice(0, 13)}...</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Assigned Roles</span>
                  <span className="font-semibold text-brand-400">{user?.roles.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Token Strategy</span>
                  <span className="text-emerald-400">Argon2id + Dual JWT</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Refresh Mechanism</span>
                  <span className="text-indigo-400">HttpOnly Cookie (7d)</span>
                </div>
              </div>
            </div>

            {/* Granted Permissions Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Active Granted Permissions</h3>
                    <p className="text-xs text-slate-400">Server-enforced fine-grained permissions ({user?.permissions.length || 0})</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-2">
                {user?.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Role-Specific Workspace Preview */}
          {primaryRole === RoleName.EMPLOYEE && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
              <h2 className="text-base font-semibold text-white mb-2">Employee Self-Service Desk</h2>
              <p className="text-xs text-slate-400 mb-6">
                Module 1 has established your Employee session with strict ownership boundaries: you can only submit tickets and view your own requests.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Ticket className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-xs font-semibold text-white">Create Ticket</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ready for Module 2</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Clock className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-xs font-semibold text-white">Track Requests</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ownership scoper active</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <FileText className="w-5 h-5 text-emerald-400 mb-2" />
                  <p className="text-xs font-semibold text-white">Browse Knowledge</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ready for Module 6</p>
                </div>
              </div>
            </div>
          )}

          {(primaryRole === RoleName.SYSTEM_ADMINISTRATOR || primaryRole === RoleName.IT_MANAGER) && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-semibold text-white">Live Enterprise User Directory (API Protected)</h2>
                </div>
                <span className="text-xs text-slate-400">{usersList.length} accounts returned by backend</span>
              </div>

              {apiError ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {apiError}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-3">
                            <p className="font-semibold text-white">{u.firstName} {u.lastName}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </td>
                          <td className="py-3 px-3 text-slate-300">{u.department || '—'}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-brand-300 border border-slate-700">
                              {u.userRoles?.[0]?.role?.displayName || 'Role'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle className="w-3 h-3" />
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {primaryRole === RoleName.IT_SUPPORT_AGENT && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
              <h2 className="text-base font-semibold text-white mb-2">IT Support Agent Queue</h2>
              <p className="text-xs text-slate-400 mb-6">
                Module 1 has granted you access to internal notes and agent assignment capabilities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Layers className="w-5 h-5 text-indigo-400 mb-2" />
                  <p className="text-xs font-semibold text-white">Assigned Queue</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ready for Module 2</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Clock className="w-5 h-5 text-rose-400 mb-2" />
                  <p className="text-xs font-semibold text-white">SLA Deadlines</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ready for Module 3</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-xs font-semibold text-white">Incident Swarming</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ready for Module 4</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

