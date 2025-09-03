import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        console.error(data.error);
        return false;
      }

      // Guardar sesión y usuario
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('supabase_session', JSON.stringify(data.session));
      return true;
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      return false;
    }
  };
  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        console.error(data.error);
        return false;
      }

      // Guardar usuario registrado
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      return false;
    }
  };


  const logout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('supabase_session');
  };


  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}