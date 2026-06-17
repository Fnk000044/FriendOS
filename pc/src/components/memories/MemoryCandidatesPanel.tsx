import { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckSquare, Square, RotateCw, BookOpen, CheckSquare as CheckIcon, X, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../db';
import { useMemoryCandidates } from '../../hooks/useMemoryCandidates';
import { useLanguage } from '../../i18n/useLanguage';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import type { MemoryCandidate } from '../../db/models';

const AI_TOGGLE_KEY = 'lifeos_ai_extraction';

export default function MemoryCandidatesPanel() {
  const { t } = useLanguage();
  const { confirmSelected, rejectSelected, scanForCandidates, scanWithAI } = useMemoryCandidates();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(() => localStorage.getItem(AI_TOGGLE_KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(AI_TOGGLE_KEY, aiEnabled ? 'true' : 'false');
  }, [aiEnabled]);

  const candidates = useLiveQuery(
    () => db.memoryCandidates
      .where('status')
      .equals('pending' as const)
      .toArray(),
  );

  const handleToggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!candidates) return;
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map(c => c.id)));
    }
  }, [candidates, selected]);

  const handleConfirmSelected = useCallback(async () => {
    if (!candidates) return;
    const toConfirm = candidates.filter(c => selected.has(c.id));
    if (toConfirm.length === 0) return;
    const count = await confirmSelected(toConfirm);
    setSelected(new Set());
  }, [candidates, selected, confirmSelected]);

  const handleRejectSelected = useCallback(async () => {
    if (!candidates) return;
    const toReject = candidates.filter(c => selected.has(c.id));
    if (toReject.length === 0) return;
    await rejectSelected(toReject);
    setSelected(new Set());
  }, [candidates, selected, rejectSelected]);

  const handleScan = useCallback(async () => {
    setScanning(true);
    try {
      const count = await (aiEnabled ? scanWithAI() : scanForCandidates());
      if (count > 0) {
        toast.success(t('memory.candidates_found', { count }));
      } else {
        toast.success(t('memory.candidates_none'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Scan failed:', msg, err);
      toast.error(`${t('memory.candidates_error')}: ${msg}`);
    }
    setScanning(false);
  }, [aiEnabled, scanForCandidates, scanWithAI, t]);

  if (!candidates) return <LoadingSpinner text={t('common.loading')} />;

  if (candidates.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title={t('memory.candidates_empty')}
          description={t('memory.candidates_empty_desc')}
        />
        <div className="flex flex-col items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={aiEnabled}
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                aiEnabled ? 'bg-primary' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform ${
                  aiEnabled ? 'translate-x-5' : ''
                }`}
                style={{ background: 'var(--bg-card-solid)' }}
              />
            </button>
            <span className="flex items-center gap-1 text-sm text-text-secondary">
              <Brain className="w-3.5 h-3.5" />
              {t('memory.candidates_ai_toggle')}
            </span>
          </label>
          <Button onClick={handleScan} disabled={scanning}>
            <RotateCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning && aiEnabled ? t('memory.candidates_ai_scan') : t('memory.candidates_scan')}
          </Button>
        </div>
      </div>
    );
  }

  const selectedCount = selected.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {selected.size === candidates.length ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {t('memory.candidates_select_all')} ({candidates.length})
        </button>

        <Button size="sm" onClick={handleScan} disabled={scanning}>
          <RotateCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {t('memory.candidates_scan')}
        </Button>
      </div>

      <div className="space-y-2">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            selected={selected.has(candidate.id)}
            onToggle={() => handleToggle(candidate.id)}
          />
        ))}
      </div>

      {selectedCount > 0 && (
        <div className="sticky bottom-0 flex items-center justify-center gap-3 py-4 backdrop-blur border-t rounded-b-card" style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--glass-border)' }}>
          <Button onClick={handleConfirmSelected}>
            <CheckIcon className="w-4 h-4" />
            {t('memory.candidates_confirm', { n: selectedCount })}
          </Button>
          <Button variant="secondary" onClick={handleRejectSelected}>
            <X className="w-4 h-4" />
            {t('memory.candidates_reject', { n: selectedCount })}
          </Button>
        </div>
      )}
    </div>
  );
}

interface CandidateCardProps {
  candidate: MemoryCandidate;
  selected: boolean;
  onToggle: () => void;
}

function CandidateCard({ candidate, selected, onToggle }: CandidateCardProps) {
  const { t } = useLanguage();
  const sourceLabels: Record<string, string> = {
    diary: t('memory.candidates_source_diary'),
    task: t('memory.candidates_source_task'),
    quick_capture: t('memory.candidates_source_capture'),
  };

  return (
    <div
      onClick={onToggle}
      className={`glass-card p-4 cursor-pointer transition-all duration-200 border-2 ${
        selected ? 'border-primary' : 'border-transparent hover:shadow-card-hover'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {selected ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5 text-text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-text-muted font-medium" style={{ background: 'var(--bg-hover)' }}>
              {sourceLabels[candidate.sourceType] || candidate.sourceType}
            </span>
            <span className="text-[10px] text-text-muted">{candidate.sourceDate}</span>
          </div>

          <h3 className="text-sm font-medium text-text-primary mb-1">{candidate.extractedTitle}</h3>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{candidate.extractedContent}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {candidate.suggestedCategory}
            </span>
            {candidate.suggestedTags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 text-text-muted rounded-full" style={{ background: 'var(--bg-hover)' }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
