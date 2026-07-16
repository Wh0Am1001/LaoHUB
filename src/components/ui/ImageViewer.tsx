import { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ImageViewerProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <img
        src={src}
        alt={alt ?? ''}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}
