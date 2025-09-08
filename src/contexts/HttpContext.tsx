import React, { createContext, useContext } from 'react';
import { useToken } from './TokenContext';

interface HttpContextType {
  get: (url: string) => Promise<any>;
  post: (url: string, data?: any) => Promise<any>;
  put: (url: string, data?: any) => Promise<any>;
  delete: (url: string) => Promise<any>;
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
  const baseUrl = process.env.API_URL;
  const tokenProvider = useToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(tokenProvider.token ? { Authorization: `Bearer ${tokenProvider.token}` } : {})
  };

  const handleResponse = async <T = any>(response: Response): Promise<T> => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error en la petición');
    return data;
  };

  const get = async <T = any>(url: string): Promise<T> => {
    const headers = {
      'Content-Type': 'application/json',
      ...(tokenProvider.token ? { Authorization: `Bearer ${tokenProvider.token}` } : {})
    };
    const response = await fetch(`${baseUrl}${url}`, { headers });
    return handleResponse<T>(response);
  };

  const post = async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return handleResponse<T>(response);
  };

  const put = (url: string, data?: any) =>
    fetch(`${baseUrl}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    }).then(handleResponse);

  const delete_ = (url: string) =>
    fetch(`${baseUrl}${url}`, {
      method: 'DELETE',
      headers
    }).then(handleResponse);

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
