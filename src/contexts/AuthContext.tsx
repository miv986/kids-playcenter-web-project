import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth';
import { supabase } from '../lib/supabaseClient';

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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)

    if (error || !data.user) return false;

    // 👇 Validar si ya confirmó el correo
    if (!data.user.email_confirmed_at) {
      alert("Debes confirmar tu correo antes de iniciar sesión.");
      return false;
    }
    setUser({
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || '',
      role: 'user',
    })
    localStorage.setItem('user', JSON.stringify(data.user));
    return true

  };


  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password, options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    })
    setIsLoading(false)

    if (error || !data.user) return false

    alert('Registro exitoso. Revisa tu correo y confirma tu cuenta para poder acceder.');

    return true
  };


  const logout = async () => {
    const { error } = await supabase.auth.signOut({

    })

    if (error) return false
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