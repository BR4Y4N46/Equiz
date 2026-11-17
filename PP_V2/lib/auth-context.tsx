// use client.txt - Modificado
"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
  username: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: { email: string; username: string; phone?: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res?.json?.();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res?.json?.();
      if (res?.ok) {
        setUser({ 
          userId: data?.user?.id, 
          email: data?.user?.email, 
          role: data?.user?.role, 
          username: data?.user?.username 
        });
        return { ok: true };
      }
      return { ok: false, error: data?.error ?? 'Error al iniciar sesión' };
    } catch {
      return { ok: false, error: 'Error de conexión' };
    }
  }, []);

  const register = useCallback(async (data: { email: string; username: string; phone?: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res?.json?.();
      if (res?.ok) {
        setUser({ 
          userId: result?.user?.id, 
          email: result?.user?.email, 
          role: result?.user?.role, 
          username: result?.user?.username 
        });
        return { ok: true };
      }
      return { ok: false, error: result?.error ?? 'Error al registrar' };
    } catch {
      return { ok: false, error: 'Error de conexión' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
