"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "../types/auth";
import { useHttp } from "./HttpContext";
import { useToken } from "./TokenContext";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null as User | null);
  const httpProvider = useHttp();
  const tokenProvider = useToken();

  useEffect(() => {
    if (!!tokenProvider.token) {
      getMe();
    }
  }, [tokenProvider.token])


  // 🔹 GET ME
  const getMe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const user = await httpProvider.get('/api/auth/me');
      setUser(user);
      return true;
    } catch (error) {
      console.error("Me error", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 LOGIN
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await httpProvider.post('/api/auth/login', { email, password });

      if (!data.user.isEmailVerified) {
        alert("Debes confirmar tu correo antes de iniciar sesión.");
        return false;
      }
      setUser(data.user);
      tokenProvider.setToken(data.token);

      return true;
    } catch (error) {
      console.error("Login error", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  // 🔹 REGISTER
  const register = async (email: string, password: string, name: string, surname: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await httpProvider.post('/api/auth/register', { email, password, name, surname });
      alert("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");
      return true;
    } catch (error) {
      console.error("Register error", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 LOGOUT
  const logout = async () => {
    try {
      await httpProvider.post('/api/auth/logout');
      setUser(null);
      tokenProvider.setToken(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        login,
        register,
        logout,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
