import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} card-base glass p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-display font-semibold">{title}</h2>}
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
