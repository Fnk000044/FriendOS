import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Sparkles } from 'lucide-react';
import { db } from '../../db';
import { useDiary } from '../../hooks/useDiary';
import MoodSelector from './MoodSelector';
import WeatherSelector from './WeatherSelector';
import Button from '../common/Button';
import TagInput from '../common/TagInput';
import { useLanguage } from '../../i18n/useLanguage';
import SentimentBadge, { CloudAnalysisBanner } from './SentimentBadge';
import type { SentimentResult, CloudAnalysisResult } from '../../hooks/useSentiment';
import { useCrisisStore } from '../../stores/crisisStore';
import GuidedJournal, { JOURNAL_TEMPLATES, type JournalTemplate, GuidedJournalWizard } from './GuidedJournal';
import EmotionPicker from './EmotionPicker';
import { useTypingTracker, useDateParam } from '../../hooks/useTypingTracker';
import { useDiarySaveEffects } from '../../hooks/useDiarySaveEffects';

/**
 * DiaryEditor —— 日记编辑器
 *
 * 历史上单文件 541 行，承载：
 *  - 编辑态（title/content/mood/weather/tags/emotions）
 *  - 情感分析 debounce + UI
 *  - 打字行为追踪
 *  - 保存副作用链（emotionRecords + behaviorRecords + 健康画像 + 记忆扫描 + 危机触发）
 *
 * 现已抽出：
 *  - 打字追踪 → useTypingTracker()
 *  - 保存副作用 → useDiarySaveEffects().runDiarySaveEffects(...)
 *  - ?date= 参数 → useDateParam()
 * 本组件保留：编辑态管理 + 情感分析 debounce + UI 渲染 + 保存编排。
 */
export default function DiaryEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createEntry, updateEntry, deleteEntry } = useDiary();

  const existingEntry = useLiveQuery(
    () => (id ? db.diaries.get(id) : undefined),
    [id],
  );

  const date = useDateParam();
  const [dateState, setDateState] = useState(date);
  // useDateParam 初始值是同步计算的，但若 hash 后续变化需要同步——这里简单用一次
  useEffect(() => { setDateState(date); }, [date]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [emotions, setEmotions] = useState<Record<string, number>>({});
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [weather, setWeather] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [cloudResult, setCloudResult] = useState<CloudAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('free');
  const [showTemplates, setShowTemplates] = useState(false);
  const [wizardTemplate, setWizardTemplate] = useState<JournalTemplate | null>(null);
  const showCrisis = useCrisisStore((s) => s.show);

  const { typingSessionRef, handleKeyDown, updateTotalChars, calculateTypingMetrics } = useTypingTracker();
  const { saving, setSaving, runDiarySaveEffects } = useDiarySaveEffects();

  // 跟踪 existingEntry 是否已填充到本地 state，避免 LiveQuery 新引用覆盖用户编辑
  const seededRef = useRef(false);

  // 仅在切换日记条目（id 变化）时填充，避免 LiveQuery 每次 tick 返回新引用覆盖用户编辑
  useEffect(() => {
    if (id !== undefined && !seededRef.current && existingEntry) {
      setDateState(existingEntry.date);
      setTitle(existingEntry.title || '');
      setContent(existingEntry.content);
      setMood(existingEntry.mood);
      setWeather(existingEntry.weather || '');
      setTags(existingEntry.tags || []);
      seededRef.current = true;
    }
  }, [existingEntry, id]);

  // 添加键盘事件监听（打字追踪）
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // id 切换（新建/编辑不同条目）时重置 seed 标记，允许 existingEntry 重新填充
  useEffect(() => {
    seededRef.current = false;
  }, [id]);

  const handleTemplateSelect = (template: JournalTemplate) => {
    setSelectedTemplate(template.id);
    setShowTemplates(false);

    if (template.id === 'free') {
      // Free journal, don't change content
      return;
    }

    // 引导式模板：进入分步问答向导
    setWizardTemplate(template);
  };

  const handleWizardComplete = (result: { title: string; content: string }) => {
    setTitle(result.title);
    setContent(result.content);
    setWizardTemplate(null);
  };

  const handleWizardCancel = () => {
    setWizardTemplate(null);
    setSelectedTemplate('free');
  };

  // Analyze sentiment when content changes (仅分析，不写数据库)
  useEffect(() => {
    if (!content.trim() || content.length < 10) {
      setSentimentResult(null);
      setCloudResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      const api = window.electronAPI;
      if (!api?.sentimentAnalyze) return;

      setAnalyzing(true);
      const startTime = Date.now();
      try {
        const result = await api.sentimentAnalyze(content);

        // Ensure loading animation shows for at least 600ms
        const elapsed = Date.now() - startTime;
        if (elapsed < 600) {
          await new Promise(resolve => setTimeout(resolve, 600 - elapsed));
        }

        if (!result) {
          setSentimentResult(null);
          setAnalyzing(false);
          return;
        }

        setSentimentResult(result);

        if (result?.needCloud && api?.sentimentCloudAnalyze) {
          const cloud = await api.sentimentCloudAnalyze(content, { mood });
          setCloudResult(cloud);
        }
      } catch (err) {
        console.error('[DiaryEditor] Sentiment analysis error:', err);
      } finally {
        setAnalyzing(false);
      }
    }, 1500); // Debounce 1.5s

    return () => clearTimeout(timer);
  }, [content]); // Removed mood from deps - mood doesn't affect text analysis

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);

    // Merge user-selected emotions into tags
    const emotionTags = Object.keys(emotions).length > 0
      ? Object.entries(emotions).map(([key, intensity]) => `emotion:${key}:${intensity}`)
      : [];
    const mergedTags = [...new Set([...tags, ...emotionTags])];

    try {
      if (id) {
        await updateEntry(id, { title, content, mood, weather, tags: mergedTags });
      } else {
        await createEntry({ date: dateState, title, content, mood, weather, tags: mergedTags });
      }

      // 触发保存副作用链（emotionRecords / behaviorRecords / 健康画像 / 记忆扫描 / 危机触发）
      await runDiarySaveEffects({
        date: dateState,
        content,
        mood,
        diaryId: id,
        sentimentResult,
        typingMetrics: calculateTypingMetrics(),
        showCrisis,
      });

      // Navigate first, then update state (prevents state update on unmounted component)
      navigate('/diary');
    } catch (err) {
      console.error('[DiaryEditor] Save error:', err);
      toast.error(t('diary.save') + '失败，请重试');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate('/diary')}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('diary.back')}
      </button>

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-text-muted sr-only">{t('diary.date_label')}</span>
            <input
              type="date"
              value={dateState}
              onChange={(e) => setDateState(e.target.value)}
              aria-label={t('diary.date_label')}
              className="text-sm px-3 py-1.5 rounded-btn border focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ borderColor: 'var(--glass-border)' }}
            />
          </label>
          <div className="flex items-center gap-2">
            <MoodSelector value={mood} onChange={setMood} />
            <button
              type="button"
              onClick={() => setShowEmotionPicker(!showEmotionPicker)}
              aria-label={Object.keys(emotions).length > 0 ? `${Object.keys(emotions).length} 种情绪` : '详细情绪'}
              className={`px-2 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                Object.keys(emotions).length > 0
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={Object.keys(emotions).length > 0 ? undefined : { background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}
            >
              {Object.keys(emotions).length > 0
                ? `${Object.keys(emotions).length} 种情绪`
                : '详细情绪'
              }
            </button>
          </div>
        </div>

        {/* Emotion Picker (collapsible) */}
        {showEmotionPicker && (
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--glass-border)' }}>
            <EmotionPicker
              value={emotions}
              onChange={setEmotions}
              compact
            />
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('diary.title_placeholder')}
          aria-label={t('diary.title_placeholder')}
          className="w-full text-lg font-semibold outline-none placeholder:text-text-muted bg-transparent"
          style={{ color: 'var(--text-primary)' }}
        />

        {/* Template Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
              showTemplates
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            style={showTemplates ? undefined : { background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            {selectedTemplate === 'free' ? '选择模板' : JOURNAL_TEMPLATES.find(t => t.id === selectedTemplate)?.name || '模板'}
          </button>
          {selectedTemplate !== 'free' && (
            <button
              type="button"
              onClick={() => {
                setSelectedTemplate('free');
                setContent('');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
            >
              清除模板
            </button>
          )}
        </div>

        {/* Template Selector */}
        {showTemplates && (
          <GuidedJournal
            onSelect={handleTemplateSelect}
            selectedId={selectedTemplate}
          />
        )}

        {/* 引导式日记向导 */}
        {wizardTemplate && (
          <div className="glass-card rounded-lg p-4 border" style={{ borderColor: 'var(--glass-border)' }}>
            <GuidedJournalWizard
              template={wizardTemplate}
              onComplete={handleWizardComplete}
              onCancel={handleWizardCancel}
            />
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => {
            const newContent = e.target.value;
            setContent(newContent);
            // 追踪打字字符数
            updateTotalChars(newContent.length);
          }}
          placeholder={t('diary.content_placeholder')}
          aria-label={t('diary.content_placeholder')}
          className="w-full min-h-[300px] text-sm leading-relaxed outline-none resize-none placeholder:text-text-muted bg-transparent border rounded-lg px-4 py-3"
          style={{ borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
        />

        {/* Sentiment Analysis Results - always visible */}
        <div className="pt-2 border-t min-h-[36px]" style={{ borderColor: 'var(--glass-border)' }}>
          {analyzing ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg animate-pulse" style={{ background: 'var(--bg-hover)' }}>
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
              </div>
              <span className="text-xs text-indigo-600 font-medium">正在分析情感...</span>
              <div className="flex-1" />
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : sentimentResult ? (
            <SentimentBadge result={sentimentResult} diaryContent={content} />
          ) : (
            <div className="flex items-center gap-2 px-1 py-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-400">情感分析就绪，输入内容后自动分析</span>
            </div>
          )}
        </div>

        {/* Cloud Analysis Banner */}
        {showBanner && cloudResult && cloudResult.suggestions.length > 0 && (
          <CloudAnalysisBanner
            suggestions={cloudResult.suggestions}
            crisisLevel={cloudResult.crisisLevel}
            onDismiss={() => setShowBanner(false)}
          />
        )}

        <div className="flex items-center gap-4 pt-4 border-t flex-wrap" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted shrink-0">{t('diary.weather')}</span>
            <WeatherSelector value={weather} onChange={setWeather} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <TagInput tags={tags} onChange={setTags} placeholder={t('diary.tags_placeholder')} />
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <div>
            {id && (
              <Button variant="danger" onClick={async () => {
                if (window.confirm(t('common.delete_confirm'))) {
                  await deleteEntry(id);
                  navigate('/diary');
                }
              }}>
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/diary')}>{t('diary.cancel')}</Button>
            <Button onClick={handleSave} disabled={!content.trim() || saving}>
              {id ? t('diary.update') : t('diary.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
