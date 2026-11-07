'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { RoleName } from '@/types/auth';
import { LogOut, Shield, User, Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role: RoleName) => {
    switch (role) {
      case RoleName.SYSTEM_ADMINISTRATOR:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case RoleName.IT_MANAGER:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case RoleName.IT_SUPPORT_AGENT:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case RoleName.EMPLOYEE:
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const primaryRole = user?.roles[0] || RoleName.EMPLOYEE;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Workspace Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white tracking-tight text-base">ServiceOps</span>
          <span className="text-xs text-slate-400 block -mt-1 font-medium">Enterprise ITSM</span>
        </div>
      </div>

      {/* Profile & Role Actions */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(primaryRole)}`}>
          {primaryRole.replace(/_/g, ' ')}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-[11px] text-slate-400">{user?.email}</p>
          </div>
        </div>

        {/* Notifications Icon (Mock) */}
        <button
          title="Notifications"
          className="w-9 h-9 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 flex items-center justify-center transition relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-brand-500 absolute top-2 right-2" />
        </button>

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          title="Sign Out"
          className="w-9 h-9 rounded-xl border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 flex items-center justify-center transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

