import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const ANIM_DURATION = 250; // ms, 与 CSS 匹配

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // 退出动画：实际渲染保持到动画结束
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      // 触发退出动画
      setExiting(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, ANIM_DURATION);
      return () => clearTimeout(timer);
    }
  }, [open, visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
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
  }, [handleClose]);

  useEffect(() => {
    if (visible && !exiting) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setTimeout(() => dialogRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, exiting, handleKeyDown]);

  if (!visible) return null;

  // 用 portal 渲染到 body：避免父容器 transform/filter 创建层叠上下文
  // 导致 fixed 遮罩定位异常（二级窗口取消时"闪黑"的根因之一）
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.4)',
        animation: exiting ? 'fadeOut 0.2s ease' : 'fadeIn 0.2s ease',
      }}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || '对话框'}
        tabIndex={-1}
        className={`rounded-2xl shadow-xl w-full ${maxWidth} mx-4 my-auto max-h-[85vh] flex flex-col outline-none border`}
        style={{
          animation: exiting
            ? 'modalScaleOut 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'modalScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: 'var(--bg-card-solid, var(--bg-card))',
          borderColor: 'var(--glass-border)',
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            <button
              onClick={handleClose}
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
    </div>,
    document.body,
  );
}
