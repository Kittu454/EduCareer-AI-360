'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthRole } from '../types';
import { apiFetch, getAccessToken, setAccessToken } from '../lib/api';

interface LoginResult {
  success: boolean;
  user?: User;
  message?: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionYear: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<LoginResult>;
  register: (input: RegisterInput) => Promise<LoginResult>;
  logout: () => Promise<void>;
  hasRole: (role: AuthRole | AuthRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Maps a user's roles to the correct landing page (never a frontend-only guess:
// it is derived from the authenticated user returned by /auth/me).
export function homePathForRoles(roles: AuthRole[]): string {
  if (roles.includes('ADMIN')) return '/admin/dashboard';
  if (roles.includes('TPO')) return '/tpo/dashboard';
  if (roles.includes('FACULTY')) return '/faculty/dashboard';
  if (roles.includes('STUDENT')) return '/student/dashboard';
  return '/login';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async (): Promise<User | null> => {
    // /auth/me returns { data: { user: AuthenticatedUser } } — read res.data.user,
    // NOT res.data, otherwise `user.roles` is undefined and every dashboard crashes
    // (e.g. DashboardLayout: user.roles.includes(...) on refresh).
    const res = await apiFetch<{ user: User }>('/auth/me');
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }
    setUser(null);
    return null;
  }, []);

  const refreshUser = useCallback(async () => {
    // If we already hold an access token, /auth/me (with silent refresh in apiFetch)
    // is authoritative. Otherwise try to re-establish a session from the refresh cookie.
    if (!getAccessToken()) {
      const refreshed = await apiFetch<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
      if (refreshed.success && refreshed.data?.accessToken) {
        setAccessToken(refreshed.data.accessToken);
      } else {
        setUser(null);
        setLoading(false);
        return;
      }
    }
    await loadMe();
    setLoading(false);
  }, [loadMe]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    setLoading(true);
    const res = await apiFetch<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });

    if (res.success && res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setLoading(false);
      return { success: true, user: res.data.user };
    }

    setLoading(false);
    return {
      success: false,
      message: res.error?.message || 'Login failed. Please verify your credentials.',
    };
  };

  const register = async (input: RegisterInput): Promise<LoginResult> => {
    setLoading(true);
    const regRes = await apiFetch<{ userId: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (!regRes.success) {
      setLoading(false);
      return {
        success: false,
        message: regRes.error?.message || 'Registration failed. Please try again.',
      };
    }

    // Account was created for real on the backend. Establish an authenticated
    // session immediately (works because dev accounts are auto-verified).
    const loginRes = await login(input.email, input.password);
    return loginRes;
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setAccessToken(null);
    setUser(null);
  };

  const hasRole = (roles: AuthRole | AuthRole[]) => {
    if (!user) return false;
    const required = Array.isArray(roles) ? roles : [roles];
    return user.roles.some((r) => required.includes(r));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
