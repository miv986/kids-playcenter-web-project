import { useState, useCallback } from 'react';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import React from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: { message: '' },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(true);
    }
    setConfirmState({
      isOpen: false,
      options: { message: '' },
      resolve: null,
    });
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(false);
    }
    setConfirmState({
      isOpen: false,
      options: { message: '' },
      resolve: null,
    });
  }, [confirmState]);

  const ConfirmComponent = React.createElement(ConfirmDialog, {
    isOpen: confirmState.isOpen,
    onClose: handleCancel,
    onConfirm: handleConfirm,
    title: confirmState.options.title,
    message: confirmState.options.message,
    confirmText: confirmState.options.confirmText,
    cancelText: confirmState.options.cancelText,
    variant: confirmState.options.variant,
  });

  return { confirm, ConfirmComponent };
}

