import Modal from './Modal';
import Button from './Button';

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
  confirmText = '确认', variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-text-secondary">{message}</p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose}>取消</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
