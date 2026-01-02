import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger'
}: ConfirmDialogProps) {
  const { t } = useTranslation('Common');
  const defaultConfirmText = confirmText || t('confirm');
  const defaultCancelText = cancelText || t('cancel');
  
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: 'bg-red-500 hover:bg-red-600 text-white',
      icon: 'text-red-500',
      border: 'border-red-200'
    },
    warning: {
      button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      icon: 'text-yellow-500',
      border: 'border-yellow-200'
    },
    info: {
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
      icon: 'text-blue-500',
      border: 'border-blue-200'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 ${styles.icon}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              {title && (
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {title}
                </h3>
              )}
              <p className="text-gray-600">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              {defaultCancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 ${styles.button} px-4 py-2 rounded-xl font-medium transition-colors`}
            >
              {defaultConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

