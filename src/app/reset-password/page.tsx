"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { useHttp } from '../../contexts/HttpContext';
import { showToast } from '../../lib/toast';
import { Spinner } from '../../components/shared/Spinner';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const httpProvider = useHttp();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setError('Token o email faltante en la URL');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('Token o email faltante');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      await httpProvider.post('/api/auth/reset-password', {
        token,
        email,
        password,
      });
      
      setIsSuccess(true);
      showToast.success('Contraseña actualizada correctamente');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      setError(error?.message || 'Error al actualizar la contraseña');
      showToast.error(error?.message || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="bg-white rounded-3xl shadow-soft-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Contraseña actualizada!</h2>
          <p className="text-gray-600 mb-6">
            Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio.
          </p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="bg-white rounded-3xl shadow-soft-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Restablecer contraseña</h2>
          <p className="text-gray-600">Introduce tu nueva contraseña</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200"
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200"
                placeholder="Repite la contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token || !email}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span>Actualizando...</span>
              </>
            ) : (
              'Actualizar contraseña'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-green-500 font-medium"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="bg-white rounded-3xl shadow-soft-lg max-w-md w-full p-8 text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cargando...</h2>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

