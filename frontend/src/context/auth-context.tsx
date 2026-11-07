'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken, getAccessToken } from '@/lib/api';
import { UserProfile, RoleName } from '@/types/auth';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  hasRole: (role: RoleName | RoleName[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silent token refresh check on application mount
  const checkInitialAuth = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh', {});
      if (response.data?.data) {
        const { accessToken, user: profile } = response.data.data;
        setAccessToken(accessToken);
        setAccessTokenState(accessToken);
        setUser(profile);
      }
    } catch {
      // No active refresh session exists, user remains logged out
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkInitialAuth();
  }, [checkInitialAuth]);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password: pass,
      });

      const { accessToken, user: profile } = response.data.data;
      setAccessToken(accessToken);
      setAccessTokenState(accessToken);
      setUser(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  const hasRole = (role: RoleName | RoleName[]): boolean => {
    if (!user) return false;
    const required = Array.isArray(role) ? role : [role];
    return user.roles.some((r) => required.includes(r));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: accessTokenState,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

