import Modal from './Modal';
import Button from './Button';
import { useLanguage } from '../../i18n/useLanguage';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmText, variant = 'danger',
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-text-secondary">{message}</p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>
          {confirmText ?? t('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
}
