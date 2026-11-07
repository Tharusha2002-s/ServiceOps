'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { RoleName } from '@/types/auth';

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
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--paper)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink-soft)',
          fontFamily: 'var(--sans)',
        }}
      >
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Authenticating Session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check Role Restriction
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--paper)',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          fontFamily: 'var(--sans)',
        }}
      >
        <div className="card" style={{ maxWidth: 460, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 8, color: 'var(--ink)' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>
            Your role (<strong style={{ color: 'var(--copper)' }}>{user?.roles.join(', ')}</strong>) is not authorized to view this screen.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Return to My Workspace
          </button>
        </div>
      </div>
    );
  }

  // Check Permission Restriction
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--paper)',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          fontFamily: 'var(--sans)',
        }}
      >
        <div className="card" style={{ maxWidth: 460, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 8, color: 'var(--ink)' }}>
            Missing Permission
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>
            Required permission: <code className="mono">{requiredPermission}</code>
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
