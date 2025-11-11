import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '../admin/AdminDashboard';
import {UserDashboard} from '../user/UserDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { showToast } from '../../lib/toast';
import { Spinner } from '../shared/Spinner';
import { LogIn, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslation('Dashboard');
  const [sessionExpired, setSessionExpired] = useState(false);

  // Escuchar cuando la sesión expira
  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true);
      showToast.error(t.t('sessionExpired') || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      // Redirigir al inicio después de un breve delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, [router, t]);

  // Redirigir si no hay usuario y no está cargando
  useEffect(() => {
    if (!isLoading && !user) {
      // Pequeño delay para evitar redirecciones innecesarias durante la carga inicial
      const timer = setTimeout(() => {
        router.push('/');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.t('loading') || 'Cargando...'}</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar mensaje mientras redirige
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {sessionExpired 
              ? (t.t('sessionExpired') || 'Sesión Expirada')
              : (t.t('mustLogin') || 'Debes iniciar sesión')
            }
          </h2>
          <p className="text-gray-600 mb-6">
            {sessionExpired
              ? 'Tu sesión ha expirado por seguridad. Serás redirigido al inicio para iniciar sesión nuevamente.'
              : 'Necesitas iniciar sesión para acceder a esta sección. Serás redirigido al inicio.'
            }
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <LogIn className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Redirigiendo...</span>
          </div>
        </div>
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" text={t.t('loading') || 'Cargando...'} />
      </div>
    }>
      <UserDashboard />
    </Suspense>
  );
}