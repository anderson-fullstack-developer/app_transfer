'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type AuthResult, type AuthUser, type LoginInput, type RegisterInput } from '@app/shared';
import { apiFetch } from './api-client';
import { setAccessToken } from './token-store';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: AuthUser | null;
  status: Status;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const bootstrap = useCallback(async () => {
    try {
      // Tenta reconstruir a sessao a partir do cookie httpOnly.
      const refreshed = await apiFetch<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        skipRefresh: true,
      });
      setAccessToken(refreshed.accessToken);
      const me = await apiFetch<AuthUser>('/auth/me');
      setUser(me);
      setStatus('authenticated');
    } catch {
      setAccessToken(null);
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const applyResult = useCallback((result: AuthResult): AuthUser => {
    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  }, []);

  const login = useCallback(
    async (input: LoginInput) =>
      applyResult(await apiFetch<AuthResult>('/auth/login', { method: 'POST', body: input })),
    [applyResult],
  );

  const register = useCallback(
    async (input: RegisterInput) =>
      applyResult(await apiFetch<AuthResult>('/auth/register', { method: 'POST', body: input })),
    [applyResult],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', skipRefresh: true });
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, refresh: bootstrap }),
    [user, status, login, register, logout, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tem de ser usado dentro de <AuthProvider>.');
  return ctx;
}
