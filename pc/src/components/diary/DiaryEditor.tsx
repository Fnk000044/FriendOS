import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Sparkles } from 'lucide-react';
import { db } from '../../db';
import { useDiary } from '../../hooks/useDiary';
import { contextService } from '../../services/ai/ContextService';
import MoodSelector from './MoodSelector';
import Button from '../common/Button';
import TagInput from '../common/TagInput';
import { useLanguage } from '../../i18n/useLanguage';
import SentimentBadge, { CloudAnalysisBanner } from './SentimentBadge';
import type { SentimentResult, CloudAnalysisResult } from '../../hooks/useSentiment';
import { useCrisisStore } from '../../stores/crisisStore';
import GuidedJournal, { JOURNAL_TEMPLATES, type JournalTemplate, GuidedJournalWizard } from './GuidedJournal';
import EmotionPicker from './EmotionPicker';

// 打字行为追踪器 - 参考 StudentLife (2014)
interface TypingSession {
  startTime: number;
  keyCount: number;
  deleteCount: number;
  pauseCount: number;
  lastKeyTime: number;
  totalChars: number;
}

export default function DiaryEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createEntry, updateEntry, deleteEntry } = useDiary();

  const existingEntry = useLiveQuery(
    () => (id ? db.diaries.get(id) : undefined),
    [id],
  );

  // 支持 ?date= 参数指定日期
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const dateParam = urlParams.get('date');
  const [date, setDate] = useState(dateParam || format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [emotions, setEmotions] = useState<Record<string, number>>({});
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [weather, setWeather] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [cloudResult, setCloudResult] = useState<CloudAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('free');
  const [showTemplates, setShowTemplates] = useState(false);
  const [wizardTemplate, setWizardTemplate] = useState<JournalTemplate | null>(null);
  const showCrisis = useCrisisStore((s) => s.show);

  // 打字行为追踪
  const typingSessionRef = useRef<TypingSession>({
    startTime: Date.now(),
    keyCount: 0,
    deleteCount: 0,
    pauseCount: 0,
    lastKeyTime: Date.now(),
    totalChars: 0,
  });
  // 跟踪 existingEntry 是否已填充到本地 state，避免 LiveQuery 新引用覆盖用户编辑
  const seededRef = useRef(false);
  const PAUSE_THRESHOLD = 2000; // 2秒无输入视为停顿

  // 追踪打字行为
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const session = typingSessionRef.current;
    const now = Date.now();

    // 检测停顿（超过2秒无输入）
    if (now - session.lastKeyTime > PAUSE_THRESHOLD && session.lastKeyTime > session.startTime) {
      session.pauseCount++;
    }

    session.keyCount++;
    session.lastKeyTime = now;

    // 检测删除键
    if (e.key === 'Backspace' || e.key === 'Delete') {
      session.deleteCount++;
    }
  }, []);

  // 计算打字行为指标
  const calculateTypingMetrics = useCallback(() => {
    const session = typingSessionRef.current;
    const durationMinutes = (Date.now() - session.startTime) / 60000;

    if (durationMinutes < 0.1 || session.keyCount < 10) {
      return null; // 数据不足
    }

    const avgSpeed = Math.round(session.totalChars / durationMinutes);
    const deleteRate = session.keyCount > 0 ? session.deleteCount / session.keyCount : 0;
    const pauseRate = session.pauseCount / durationMinutes;

    return {
      avgSpeed,
      deleteRate: Math.round(deleteRate * 100) / 100,
      pauseRate: Math.round(pauseRate * 10) / 10,
      sessionDuration: Math.round(durationMinutes * 10) / 10,
    };
  }, []);

  useEffect(() => {
    // 仅在切换日记条目（id 变化）时填充，避免 LiveQuery 每次 tick 返回新引用覆盖用户编辑
    if (id !== undefined && !seededRef.current && existingEntry) {
      setDate(existingEntry.date);
      setTitle(existingEntry.title || '');
      setContent(existingEntry.content);
      setMood(existingEntry.mood);
      setWeather(existingEntry.weather || '');
      setTags(existingEntry.tags || []);
      seededRef.current = true;
    }
    // id 变化时重置 seed 标记，允许新条目填充
    return () => {
      // 不在此重置 seededRef，由下方独立 effect 处理 id 切换
    };
  }, [existingEntry, id]);

  // 添加键盘事件监听
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
        await createEntry({ date, title, content, mood, weather, tags: mergedTags });
      }

      // 保存情感记录到数据库（仅在保存日记时写入，避免每 1.5s 重复写入）
      if (sentimentResult) {
        try {
          // 计算社交分数（从日记文本中提取社交关键词）
          let socialScore = 0;
          try {
            const socialResult = await window.electronAPI?.emotionAnalyzeDiary?.({
              content, date, mood,
            });
            socialScore = socialResult?.socialScore ?? 0;
          } catch {
            // 社交分数计算失败不影响保存
          }

          await db.emotionRecords.put({
            id: `diary-${id || date}`,
            date: date,
            source: 'diary',
            sourceId: id,
            sentimentScore: sentimentResult.score,
            emotions: {
              joy: sentimentResult.score > 0.5 ? sentimentResult.score : 0,
              sadness: sentimentResult.score < 0.3 ? 1 - sentimentResult.score : 0,
              anger: 0,
              fear: sentimentResult.level === 'high' ? 0.8 : 0,
              surprise: 0,
              disgust: 0,
            },
            socialScore,
            riskLevel: sentimentResult.level === 'high' ? 'high' : sentimentResult.level === 'medium' ? 'medium' : 'low',
            keywords: sentimentResult.keywords,
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('[DiaryEditor] Failed to save emotion record:', err);
          toast.error(t('diary.save_emotion_fail'));
        }
      }

      // 保存行为记录（无感采集）
      try {
        const existingBehavior = await db.behaviorRecords.where('date').equals(date).first();

        // 计算打字行为指标
        const typingMetrics = calculateTypingMetrics();

        const behaviorData = {
          id: existingBehavior?.id || crypto.randomUUID(),
          date,
          diaryWritten: true,
          diaryWordCount: content.length,
          moodRating: mood,
          tasksCompleted: existingBehavior?.tasksCompleted || 0,
          tasksTotal: existingBehavior?.tasksTotal || 0,
          habitsChecked: existingBehavior?.habitsChecked || 0,
          habitsTotal: existingBehavior?.habitsTotal || 0,
          activeHours: existingBehavior?.activeHours || [new Date().getHours()],
          chatMessages: existingBehavior?.chatMessages || 0,
          // 打字行为数据（无感识别创新）
          typingBehavior: typingMetrics || existingBehavior?.typingBehavior || null,
          createdAt: existingBehavior?.createdAt || new Date().toISOString(),
        };

        if (existingBehavior) {
          await db.behaviorRecords.update(existingBehavior.id, behaviorData);
        } else {
          await db.behaviorRecords.add(behaviorData);
        }

        // 调用行为分析引擎（如果可用）
        if (typingMetrics && window.electronAPI?.behaviorAnalyzeDaily) {
          try {
            await window.electronAPI.behaviorAnalyzeDaily(behaviorData, {});
          } catch (err) {
            console.error('[DiaryEditor] Behavior analysis error:', err);
          }
        }
      } catch (err) {
        console.error('[DiaryEditor] Failed to save behavior record:', err);
      }

      // 生成健康画像（后台异步，不阻塞保存）
      import('../../services/emotion/HealthProfileService').then(({ generateHealthProfile }) => {
        generateHealthProfile().catch(err => {
          console.error('[DiaryEditor] Failed to generate health profile:', err);
        });
      });

      // 高风险：立即触发危机干预（原 30s 延迟对真实危机有风险，改为立即）
      // 文案柔和，避免打断保存流程后的情绪
      if (sentimentResult?.level === 'high') {
        const savedContent = content;
        showCrisis('high', 'diary', savedContent);
      }

      // Navigate first, then update state (prevents state update on unmounted component)
      // 保存日记后清除 AI 上下文缓存，使下次聊天能获取最新数据
      contextService.clearCache();
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            typingSessionRef.current.totalChars = newContent.length;
          }}
          placeholder={t('diary.content_placeholder')}
          aria-label={t('diary.content_placeholder')}
          className="w-full min-h-[300px] text-sm leading-relaxed outline-none resize-none placeholder:text-text-muted bg-transparent border rounded-lg px-4 py-3"
          style={{ borderColor: 'var(--border-input)' }}
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

        <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <input
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            placeholder={t('diary.weather_placeholder')}
            aria-label={t('diary.weather')}
            className="text-sm px-3 py-1.5 rounded-btn border focus:outline-none focus:ring-2 focus:ring-primary/30 w-32"
            style={{ borderColor: 'var(--glass-border)' }}
          />
          <div className="flex-1">
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
