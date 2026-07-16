import { createContext, useCallback, useState, type ReactNode } from 'react';
import type { ToastMessage } from '../types';

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  return <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>{children}</ToastContext.Provider>;
}
