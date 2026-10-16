import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { ApiError } from '@/shared/api/httpClient';
import { Button } from '@/shared/ui';
import { authService } from './services/authService';
import type { User } from './types';

type Auth = { user: User | null; loading: boolean; error: string | null; refresh: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  async function refresh() {
    setLoading(true); setError(null);
    try { setUser((await authService.me()).user); }
    catch (err) {
      setUser(null);
      if (!(err instanceof ApiError && err.status === 401)) setError(err instanceof Error ? err.message : 'No se pudo verificar la sesión.');
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  const value: Auth = { user, loading, error, refresh,
    login: async (identifier, password) => { setUser((await authService.login(identifier, password)).user); setError(null); },
    logout: async () => { await authService.logout(); setUser(null); setError(null); } };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider no está disponible.');
  return auth;
}
export function RequireAuth() {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <div role="status" className="flex min-h-dvh items-center justify-center text-muted">Verificando sesión…</div>;
  if (error) return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6"><p role="alert">{error}</p><Button onClick={() => void refresh()}>Reintentar</Button></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
