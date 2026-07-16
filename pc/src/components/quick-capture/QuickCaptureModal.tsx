import { useState, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import CaptureTypeBadge from './CaptureTypeBadge';
import { classifyContent, type CaptureType } from '../../utils/classification';
import { useQuickCapture } from '../../hooks/useQuickCapture';
import { useUIStore } from '../../stores/uiStore';
import { useLanguage } from '../../i18n/useLanguage';

const typeOptions: { value: CaptureType; key: 'quick_capture.todo' | 'quick_capture.diary' | 'quick_capture.idea' | 'quick_capture.memory' }[] = [
  { value: 'todo', key: 'quick_capture.todo' },
  { value: 'diary', key: 'quick_capture.diary' },
  { value: 'idea', key: 'quick_capture.idea' },
  { value: 'memory', key: 'quick_capture.memory' },
];

export default function QuickCaptureModal() {
  const { t } = useLanguage();
  const open = useUIStore((s) => s.quickCaptureOpen);
  const close = useUIStore((s) => s.closeQuickCapture);
  const { saveCapture } = useQuickCapture();

  const [content, setContent] = useState('');
  const [type, setType] = useState<CaptureType>('uncategorized');
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((val: string) => {
    setContent(val);
    setType(classifyContent(val));
  }, []);

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    await saveCapture(content, type);
    setContent('');
    setType('uncategorized');
    setSaving(false);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      close();
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={close} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">{t('quick_capture.title')}</span>
        </div>

        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('quick_capture.placeholder')}
          aria-label={t('quick_capture.placeholder')}
          className="w-full h-32 px-4 py-3 rounded-btn border text-sm resize-none
            placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            transition-all"
          style={{ borderColor: 'var(--glass-border)' }}
          autoFocus
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{t('quick_capture.type_label')}</span>
            <div className="flex gap-1.5">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    type === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-text-muted hover:border-slate-300'
                  }`}
                  style={type === opt.value ? undefined : { borderColor: 'var(--glass-border)' }}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </div>
          <CaptureTypeBadge type={type} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <Button variant="secondary" onClick={close}>{t('quick_capture.cancel')}</Button>
          <Button onClick={handleSave} disabled={!content.trim() || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t('quick_capture.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
