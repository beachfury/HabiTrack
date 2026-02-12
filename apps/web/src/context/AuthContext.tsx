import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api';

interface User {
  id: number;
  displayName: string;
  role: 'admin' | 'member' | 'kid' | 'kiosk';
  color?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
  /** True if this is a kiosk session (PIN login from local network) */
  isKiosk?: boolean;
}

interface ImpersonationState {
  active: boolean;
  originalAdmin?: { id: number; displayName: string };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  impersonation: ImpersonationState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  startImpersonating: (userId: number) => Promise<void>;
  stopImpersonating: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonation, setImpersonation] = useState<ImpersonationState>({ active: false });

  const checkImpersonationStatus = async () => {
    try {
      let impStatus: any;
      if (typeof (api as any).getImpersonationStatus === 'function') {
        impStatus = await (api as any).getImpersonationStatus();
      } else {
        impStatus = { impersonating: false };
      }
      setImpersonation({
        active: impStatus.impersonating,
        originalAdmin: impStatus.originalAdmin,
      });
    } catch {
      setImpersonation({ active: false });
    }
  };

  const refresh = async () => {
    try {
      const data = await api.getSession();
      setUser(data.user as User);

      // Only check impersonation status if user is logged in
      await checkImpersonationStatus();
    } catch {
      setUser(null);
      setImpersonation({ active: false });
    }
  };

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    await refresh();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setImpersonation({ active: false });
  };

  const startImpersonating = async (userId: number) => {
    let result: any;
    if (typeof (api as any).startImpersonation === 'function') {
      result = await (api as any).startImpersonation(userId);
    } else {
      result = { success: false };
    }
    if (result && result.success) {
      await refresh();
    }
  };

  const stopImpersonating = async () => {
    const result = await api.stopImpersonation();
    if (result.success) {
      await refresh();
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        impersonation,
        login,
        logout,
        refresh,
        startImpersonating,
        stopImpersonating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
