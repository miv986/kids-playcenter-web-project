"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { TokenContextType } from "../types/auth";

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function useToken() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
}

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Cargar token inicial de localStorage
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) setToken(stored);
  }, []);

  // 2. Intentar refrescar al cargar
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) {
            setToken(data.accessToken);
          } else {
            setToken(null);
          }
        } else {
          setToken(null);
        }
      } catch {
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    tryRefresh();
  }, []);

  // 3. Guardar token cuando cambie (una sola fuente de verdad)
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  return (
    <TokenContext.Provider
      value={{
        token,
        setToken,
        isLoading,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}
