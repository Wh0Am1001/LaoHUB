import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: 'text-emerald-400 border-emerald-400/30',
  error: 'text-red-400 border-red-400/30',
  info: 'text-secondary-400 border-secondary-400/30',
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'glass card-base flex items-start gap-3 p-3.5 pr-2 animate-fadeIn border',
              colorMap[toast.type]
            )}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-100 flex-1">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
