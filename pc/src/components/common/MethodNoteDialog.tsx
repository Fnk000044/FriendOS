import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../../i18n/useLanguage';
import { METHOD_NOTES, type MethodNoteKind } from '../../utils/methodNotes';

interface MethodNoteDialogProps {
  kind: MethodNoteKind;
  /** 附加说明（如引擎返回的 note 全文），可选 */
  extraNote?: string | null;
}

/**
 * 方法说明展示：默认 1-2 行摘要 + 「查看方法说明」按钮，
 * 点击打开弹窗查看完整方法说明（用户拍板方案：摘要 + 弹窗，非折叠）。
 */
export default function MethodNoteDialog({ kind, extraNote }: MethodNoteDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const note = METHOD_NOTES[kind];

  return (
    <>
      <div className="flex items-start gap-1.5">
        <BookOpen className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="space-y-0.5 min-w-0">
          {/* 摘要 */}
          <p className="text-[11px] text-text-muted leading-relaxed">{t(note.summaryKey)}</p>
          {extraNote && (
            <p className="text-[11px] text-text-secondary leading-relaxed">{extraNote}</p>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] text-primary hover:underline underline-offset-2 cursor-pointer"
          >
            {t('method.view_full')} →
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('method.title')} maxWidth="max-w-xl">
        <div className="space-y-4">
          {note.sections.map((sec) => (
            <section key={sec.titleKey}>
              <h4 className="text-sm font-semibold text-text-primary mb-1">{t(sec.titleKey)}</h4>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{t(sec.bodyKey)}</p>
            </section>
          ))}
          <p className="text-[11px] text-text-muted pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            ⚠️ {t('method.disclaimer')}
          </p>
          <p className="text-[11px] text-text-muted">
            {t('method.doc_ref')}: docs/risk_methodology.md
          </p>
        </div>
      </Modal>
    </>
  );
}
