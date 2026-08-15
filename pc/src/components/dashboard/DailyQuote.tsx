import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../db';
import { useLanguage } from '../../i18n/useLanguage';

const DEFAULT_QUOTES = [
  '持续精进，慢慢成为自己喜欢的样子',
  '每天进步一点点，未来可期',
  '沉淀自己，厚积薄发',
  '不忘初心，方得始终',
  '路虽远，行则将至',
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function DailyQuote() {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quoteContent, setQuoteContent] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const seededRef = useRef(false);

  const allQuotes = useLiveQuery(() => db.quotes.toArray());

  // Seed default quotes if empty — 用 ref 守卫避免重复插入
  useEffect(() => {
    if (allQuotes !== undefined && allQuotes.length === 0 && !seededRef.current) {
      seededRef.current = true;
      Promise.all(
        DEFAULT_QUOTES.map((content) =>
          db.quotes.add({
            id: generateId(),
            content,
            createdAt: new Date().toISOString(),
          })
        )
      ).catch((err) =>
        console.warn('[DailyQuote] Seed default quotes failed:', err)
      );
    }
  }, [allQuotes]);

  // Pick quote by day of year
  const quote = (() => {
    if (!allQuotes || allQuotes.length === 0) return null;
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return allQuotes[dayOfYear % allQuotes.length];
  })();

  async function handleSave() {
    if (!quoteContent.trim()) return;
    try {
      if (editingId) {
        await db.quotes.update(editingId, {
          content: quoteContent,
          author: quoteAuthor || undefined,
        });
      } else {
        await db.quotes.add({
          id: generateId(),
          content: quoteContent,
          author: quoteAuthor || undefined,
          createdAt: new Date().toISOString(),
        });
      }
      setShowModal(false);
      setQuoteContent('');
      setQuoteAuthor('');
      setEditingId(null);
    } catch (err) {
      console.error('[DailyQuote] Failed to save quote:', err);
      toast.error(t('common.save_fail'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await db.quotes.delete(id);
    } catch (err) {
      console.error('[DailyQuote] Failed to delete quote:', err);
      toast.error(t('common.delete_fail'));
    }
  }

  function openAddModal() {
    setEditingId(null);
    setQuoteContent('');
    setQuoteAuthor('');
    setShowModal(true);
  }

  function openEditModal(q: { id: string; content: string; author?: string }) {
    setEditingId(q.id);
    setQuoteContent(q.content);
    setQuoteAuthor(q.author || '');
    setShowModal(true);
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-text-muted">{t('dashboard.daily_quote')}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={openAddModal}
            className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-primary transition-colors cursor-pointer"
            title={t('dashboard.add_quote')}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!quote ? (
        <p className="text-xs text-text-muted italic">{t('dashboard.quote_placeholder')}</p>
      ) : (
        <div className="relative group">
          <div className="border-l-2 pl-3 py-0.5" style={{ borderColor: 'var(--color-primary)' }}>
            <p className="text-xs italic text-text-secondary leading-relaxed">
              "{quote.content}"
            </p>
            {quote.author && (
              <p className="text-[11px] text-text-muted mt-1 font-medium">— {quote.author}</p>
            )}
          </div>
          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
            <button
              onClick={() => openEditModal(quote)}
              className="p-1 rounded-lg hover:text-primary transition-colors cursor-pointer"
              style={{ background: 'var(--bg-hover)' }}
              title={t('dashboard.edit_quote')}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDelete(quote.id)}
              className="p-1 rounded-lg hover:text-red-500 transition-colors cursor-pointer"
              style={{ background: 'var(--bg-hover)' }}
              title={t('dashboard.delete_quote')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="glass-card glass-glow rounded-xl shadow-xl w-[360px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-text-primary">
                {editingId ? t('dashboard.edit_quote') : t('dashboard.add_quote')}
              </h4>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={quoteContent}
              onChange={(e) => setQuoteContent(e.target.value)}
              placeholder={t('dashboard.quote_placeholder')}
              className="w-full text-sm text-text-primary rounded-lg px-3 py-2 mb-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: 'var(--bg-hover)' }}
              rows={3}
              autoFocus
            />
            <input
              value={quoteAuthor}
              onChange={(e) => setQuoteAuthor(e.target.value)}
              placeholder={t('dashboard.quote_author')}
              className="w-full text-sm text-text-primary rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ background: 'var(--bg-hover)' }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}