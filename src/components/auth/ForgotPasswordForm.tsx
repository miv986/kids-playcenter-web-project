import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useHttp } from '../../contexts/HttpContext';
import { Spinner } from '../shared/Spinner';
import { showToast } from '../../lib/toast';

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
}

export function ForgotPasswordForm({ onSwitchToLogin, onClose }: ForgotPasswordFormProps) {
  const t = useTranslation('Auth');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const httpProvider = useHttp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await httpProvider.post('/api/auth/forgot-password', { email });
      setIsSuccess(true);
      showToast.success('Si el email existe, recibirás un enlace de recuperación');
    } catch (error: any) {
      showToast.error(error?.message || 'Error al enviar el email de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Email enviado</h2>
          <p className="text-gray-600 mb-6">
            Si el email existe, recibirás un enlace de recuperación en tu correo electrónico.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="text-green-500 font-medium hover:underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Recuperar contraseña</h2>
        <p className="text-gray-600">Introduce tu email para recibir un enlace de recuperación</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            {t.t('email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200"
              placeholder={t.t('emailPlaceholder')}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span>Enviando...</span>
            </>
          ) : (
            'Enviar enlace de recuperación'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-gray-600 hover:text-green-500 font-medium flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}

