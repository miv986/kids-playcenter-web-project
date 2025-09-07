"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TokenContextType } from "../types/auth";

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function useToken() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useToken must be used within an TokenProvider");
  }
  return context;
}

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("token")
    } else {
      localStorage.setItem("token", token)
    }
  }, [token])

  return (
    <TokenContext.Provider
      value={{
        token,
        setToken,
        isLoading
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}
