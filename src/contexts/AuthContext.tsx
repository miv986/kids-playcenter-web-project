"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "../types/auth";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Recuperar sesión desde localStorage al recargar página
    const storedUser = localStorage.getItem("user");
    const storedSession = localStorage.getItem("session");

    if (storedUser && storedSession) {
      setUser(JSON.parse(storedUser));
      setSession(JSON.parse(storedSession));
    }
    setIsLoading(false);
  }, []);

  // 🔹 LOGIN
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    const res = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (data.error) {
      console.error("Login error", data.error);
      return false;
    }

    if (!data.user.email_confirmed_at) {
      alert("Debes confirmar tu correo antes de iniciar sesión.");
      return false;
    }

    const loggedUser: User = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || "",
      role: email === "admin@prueba.com" ? "admin" : "user",
    };

    setUser(loggedUser);
    setSession(data.session);

    localStorage.setItem("user", JSON.stringify(loggedUser));
    localStorage.setItem("session", JSON.stringify(data.session));

    return true;
  };

  // 🔹 REGISTER
  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);

    const res = await fetch("http://localhost:4000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (data.error) {
      console.error("Register error", data.error);
      return false;
    }

    alert("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");
    return true;
  };

  // 🔹 LOGOUT
  const logout = async () => {
    await fetch("http://localhost:4000/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
    setSession(null);
    localStorage.removeItem("user");
    localStorage.removeItem("session");
  };

  const isAdmin = user?.email === "admin@prueba.com";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        login,
        register,
        logout,
        isLoading,
        token: session?.access_token ?? null,
        userId: session?.user.id ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
