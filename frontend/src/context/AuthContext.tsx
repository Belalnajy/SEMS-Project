import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import api from '../api/client';
import { User, AuthResponse } from '../types/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (nationalId: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  updateUser: (updatedUser: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('sems_token');
    const savedUser = localStorage.getItem('sems_user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      api
        .get<{ user: User }>('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('sems_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('sems_token');
          localStorage.removeItem('sems_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('sems_user', JSON.stringify(updatedUser));
  };

  const login = async (nationalId: string, password: string): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/login', {
      national_id: nationalId,
      password,
    });
    localStorage.setItem('sems_token', res.data.token);
    localStorage.setItem('sems_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data: any): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('sems_token', res.data.token);
    localStorage.setItem('sems_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('sems_token');
    localStorage.removeItem('sems_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
