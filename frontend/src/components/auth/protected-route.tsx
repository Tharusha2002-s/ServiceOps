'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { RoleName } from '@/types/auth';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { user, isLoading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
        <p className="text-sm font-medium tracking-wide">Authenticating Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Check Role Restriction
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          Your active role (<span className="text-amber-400 font-semibold">{user?.roles.join(', ')}</span>) does not hold authorization to access this view. Required role: <span className="text-indigo-400 font-semibold">{allowedRoles.join(' or ')}</span>.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition"
        >
          Return to My Workspace
        </button>
      </div>
    );
  }

  // Check Fine-grained Permission Restriction
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Missing Permission</h1>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          You require the permission <code className="bg-slate-900 px-2 py-1 rounded text-amber-400 font-mono text-xs">{requiredPermission}</code> to perform this action.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

