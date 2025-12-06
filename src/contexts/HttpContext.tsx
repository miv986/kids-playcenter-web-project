"use client";
import React, { createContext, useContext, useRef, useEffect, useCallback } from 'react';
import { useToken } from './TokenContext';

interface HttpContextType {
  get: (url: string) => Promise<any>;
  post: (url: string, data?: any) => Promise<any>;
  put: (url: string, data?: any) => Promise<any>;
  delete: (url: string, options?: any) => Promise<any>,
}

const HttpContext = createContext<HttpContextType | undefined>(undefined);

export function useHttp() {
  const context = useContext(HttpContext);
  if (!context) {
    throw new Error('useHttp must be used within HttpProvider');
  }
  return context;
}


export function HttpProvider({ children }: { children: React.ReactNode }) {

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const { token, setToken } = useToken();
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const refreshPromise = (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          setToken(null);
          return null;
        }

        const data = await res.json();
        if (data.accessToken) {
          setToken(data.accessToken);
          return data.accessToken;
        }

        setToken(null);
        return null;
      } catch {
        setToken(null);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [baseUrl, setToken]);


  const handleResponse = async (res: Response) => {
    const contentType = res.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = {};
      }
    } else {
      data = {};
    }
    
    if (!res.ok) {
      throw new Error(data.error || "Request error");
    }
    return data;
  };

  const makeRequest = async (
    url: string,
    options: RequestInit = {}): Promise<any> => {

    const finalHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers: finalHeaders,
      credentials: "include",
    });


    // ACCESS TOKEN CADUCADO → intentar refrescar
    const noRefreshRoutes = [
      "/auth/login",
      "/auth/register",
      "/auth/forgot",
      "/auth/reset",
      "/auth/refresh"
    ];

    const shouldRefresh = !noRefreshRoutes.some(r => url.includes(r));

    if (res.status === 401 && shouldRefresh) {
      const newToken = await refreshToken();

      if (!newToken) {
        throw new Error("Session expired");
      }

      const retryHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      };

      const retryRes = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      });

      return handleResponse(retryRes);
    }
    return handleResponse(res);
  }


  const get = async <T = any>(url: string): Promise<T> => {
    return makeRequest(url, { method: 'GET' });
  };

  const post = async <T = any>(url: string, data?: any): Promise<T> => {
    return makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  const put = (url: string, data?: any) => {
    return makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  };

  const delete_ = (url: string, options?: { data?: any }) => {
    return makeRequest(url, {
      method: 'DELETE',
      body: options?.data ? JSON.stringify(options.data) : undefined,
    });
  };

  return (
    <HttpContext.Provider value={{
      get,
      post,
      put,
      delete: delete_
    }}>
      {children}
    </HttpContext.Provider>
  );
}
