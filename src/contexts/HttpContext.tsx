"use client";
import React, { createContext, useContext, useRef, useEffect } from 'react';
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

interface HttpProviderProps {
  children: React.ReactNode;
  token?: string | null;
}

export function HttpProvider({ children }: HttpProviderProps) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const tokenProvider = useToken();
  const isRefreshingRef = useRef(false);
  const sessionExpiredRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // Resetear el flag cuando se establece un nuevo token
  useEffect(() => {
    if (tokenProvider.token) {
      sessionExpiredRef.current = false;
    }
  }, [tokenProvider.token]);

  const refreshToken = async (): Promise<string | null> => {
    if (sessionExpiredRef.current) return null;
    
    // Si ya hay un refresh en curso, esperar a que termine
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    
    isRefreshingRef.current = true;
    
    const refreshPromise = (async (): Promise<string | null> => {
      try {
        const response = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const newToken = data.accessToken;
          if (newToken) {
            tokenProvider.setToken(newToken);
            isRefreshingRef.current = false;
            refreshPromiseRef.current = null;
            return newToken;
          }
        }
        
        // Si falla el refresh, marcar como expirado
        sessionExpiredRef.current = true;
        tokenProvider.setToken(null);
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      } catch (error) {
        console.error('Error refreshing token:', error);
        sessionExpiredRef.current = true;
        tokenProvider.setToken(null);
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      } finally {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
      
      return null;
    })();
    
    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  };

  const makeRequest = async (
    url: string,
    options: RequestInit = {}
  ): Promise<any> => {
    // Si hay token, resetear el flag de sesión expirada
    if (tokenProvider.token) {
      sessionExpiredRef.current = false;
    }
    
    // Si la sesión expiró, no hacer más peticiones (excepto login/register)
    if (sessionExpiredRef.current && !tokenProvider.token && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      throw new Error('Session expired');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(tokenProvider.token ? { Authorization: `Bearer ${tokenProvider.token}` } : {}),
      ...options.headers
    };

    const response = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && tokenProvider.token) {
      const newToken = await refreshToken();
      if (newToken) {
        sessionExpiredRef.current = false; // Reset si el refresh fue exitoso
        const newHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers
        };
        const retryResponse = await fetch(`${baseUrl}${url}`, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
        });
        return handleResponse(retryResponse);
      } else {
        // Si el refresh falló, marcar como expirado
        sessionExpiredRef.current = true;
        throw new Error('Session expired');
      }
    }

    // Si recibimos 401 y no hay token, también marcar como expirado (solo si no es login/register)
    if (response.status === 401 && !tokenProvider.token && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      sessionExpiredRef.current = true;
    }

    return handleResponse(response);
  };

  const handleResponse = async <T = any>(response: Response): Promise<T> => {
    const data = await response.json();
    if (!response.ok) {
      // Si no hay token y es 401, lanzar error especial
      if (response.status === 401 && !tokenProvider.token) {
        throw new Error('No token provided');
      }
      throw new Error(data.error || 'Error en la petición');
    }
    return data;
  };

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

  const delete_ = (url: string, options?: {data?: any}) => {
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
