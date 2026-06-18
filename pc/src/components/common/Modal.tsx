import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setTimeout(() => dialogRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || '对话框'}
        tabIndex={-1}
        className={`rounded-2xl shadow-xl w-full ${maxWidth} mx-4 max-h-[85vh] flex flex-col outline-none border`}
        style={{
          animation: 'modalScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: 'var(--bg-card-solid, var(--bg-card))',
          borderColor: 'var(--glass-border)',
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              aria-label="关闭对话框"
              className="p-1 rounded-lg text-text-muted hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
