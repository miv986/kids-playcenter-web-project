"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { TokenContextType } from "../types/auth";

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function useToken() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
}

// Función para decodificar JWT y obtener expiración
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshToken = async () => {
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
          return true;
        }
      }
      setToken(null);
      return false;
    } catch {
      setToken(null);
      return false;
    }
  };

  // 1. Cargar token inicial de localStorage
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) setToken(stored);
  }, []);

  // 2. Intentar refrescar al cargar
  useEffect(() => {
    refreshToken().finally(() => {
      setIsLoading(false);
    });
  }, []);

  // 3. Guardar token cuando cambie (una sola fuente de verdad)
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // 4. Renovación proactiva del token antes de que expire
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearTimeout(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (!token) {
      return;
    }

    const scheduleRefresh = () => {
      const expiration = getTokenExpiration(token);
      if (!expiration) {
        // Si no podemos obtener la expiración, refrescar cada hora
        refreshIntervalRef.current = setInterval(() => {
          refreshToken();
        }, 60 * 60 * 1000) as unknown as NodeJS.Timeout;
        return;
      }

      const now = Date.now();
      const timeUntilExpiration = expiration - now;
      // Renovar 10 minutos antes de que expire (2h - 10min = 110min)
      const refreshTime = Math.max(timeUntilExpiration - 10 * 60 * 1000, 5 * 60 * 1000);

      if (refreshTime > 0) {
        refreshIntervalRef.current = setTimeout(() => {
          refreshToken();
        }, refreshTime);
      } else {
        // Si ya está cerca de expirar, refrescar inmediatamente
        refreshToken();
      }
    };

    scheduleRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
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
