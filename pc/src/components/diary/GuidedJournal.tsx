import { useState } from 'react';
import { BookOpen, Heart, Star, Moon, Lightbulb, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export interface JournalTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  prompts: string[];
  color: string;
}

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'free',
    name: '自由日记',
    icon: <BookOpen className="w-5 h-5" />,
    description: '随心所欲地记录今天',
    prompts: [],
    color: 'text-slate-600',
  },
  {
    id: 'gratitude',
    name: '感恩日记',
    icon: <Heart className="w-5 h-5" />,
    description: '记录值得感恩的事',
    prompts: [
      '今天值得感恩的 3 件事是什么？',
      '为什么这些事让我感到感恩？',
      '此刻想对生活说的一句话？',
    ],
    color: 'bg-pink-50 text-pink-600 border-pink-200',
  },
  {
    id: 'achievement',
    name: '成就日记',
    icon: <Star className="w-5 h-5" />,
    description: '记录今天完成的事',
    prompts: [
      '今天完成了哪 3 件事？',
      '为自己感到骄傲的原因是什么？',
      '这些成就反映了你怎样的优点？',
    ],
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  },
  {
    id: 'emotion_trigger',
    name: '情绪触发分析',
    icon: <Lightbulb className="w-5 h-5" />,
    description: '分析情绪产生的原因',
    prompts: [
      '发生了什么事件？（客观描述）',
      '当时脑海中浮现了什么想法？',
      '感受如何？（1-10 分表示强度）',
      '我做了什么行为反应？',
      '下次遇到类似情况，我可以怎么做？',
    ],
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    id: 'goodnight',
    name: '晚安日记',
    icon: <Moon className="w-5 h-5" />,
    description: '用美好的心情结束今天',
    prompts: [
      '今天最开心的一件事是什么？',
      '今天学到了什么？',
      '明天想做的一件事是什么？',
      '晚安，想对自己说的一句话？',
    ],
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
];

interface GuidedJournalProps {
  onSelect: (template: JournalTemplate) => void;
  selectedId?: string;
}

export default function GuidedJournal({ onSelect, selectedId }: GuidedJournalProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">选择日记模板</h3>
      <div className="grid grid-cols-2 gap-2">
        {JOURNAL_TEMPLATES.map(template => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:shadow-sm cursor-pointer ${
              selectedId === template.id
                ? 'ring-2 ring-primary border-primary'
                : template.color
            }`}
            style={selectedId === template.id || template.id !== 'free' ? undefined : { background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}
          >
            <div className="mt-0.5">{template.icon}</div>
            <div>
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs opacity-75 mt-0.5">{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 引导式日记分步问答向导 ───────────────────────────────────────
interface GuidedJournalWizardProps {
  template: JournalTemplate;
  onComplete: (result: { title: string; content: string }) => void;
  onCancel: () => void;
}

export function GuidedJournalWizard({ template, onComplete, onCancel }: GuidedJournalWizardProps) {
  const questions = template.prompts.filter(p => p.trim().length > 0);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));

  const total = questions.length;
  const isLast = step === total - 1;
  const canProceed = answers[step].trim().length > 0;

  const handleNext = () => {
    if (!canProceed) return;
    if (isLast) {
      // 拼接成一篇日记
      const lines: string[] = [];
      questions.forEach((q, i) => {
        lines.push(`## ${q}`);
        lines.push('');
        lines.push(answers[i]);
        lines.push('');
      });
      const content = lines.join('\n').trim();
      const dateStr = new Date();
      const templateNames: Record<string, string> = {
        gratitude: `${dateStr.getMonth() + 1}月${dateStr.getDate()}日 感恩日记`,
        achievement: `${dateStr.getMonth() + 1}月${dateStr.getDate()}日 成就日记`,
        emotion_trigger: `${dateStr.getMonth() + 1}月${dateStr.getDate()}日 情绪分析`,
        goodnight: `${dateStr.getMonth() + 1}月${dateStr.getDate()}日 晚安日记`,
      };
      onComplete({ title: templateNames[template.id] || template.name, content });
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* 进度 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/40' : 'w-4'
              }`}
              style={i >= step ? { background: 'var(--bg-hover)' } : undefined}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{step + 1} / {total}</span>
      </div>

      {/* 问题 */}
      <div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
          {questions[step]}
        </h3>
        <textarea
          autoFocus
          value={answers[step]}
          onChange={(e) => setAnswers(prev => prev.map((a, i) => i === step ? e.target.value : a))}
          placeholder="在这里写下你的回答..."
          className="w-full h-40 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          style={{ borderColor: 'var(--glass-border)' }}
        />
      </div>

      {/* 操作 */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}
          className="flex items-center gap-1 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {step === 0 ? '取消' : '上一步'}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            canProceed
              ? 'bg-primary text-white hover:bg-primary-dark cursor-pointer'
              : 'bg-slate-200 text-slate-400 font-semibold cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          {isLast ? (
            <>
              <Check className="w-4 h-4" aria-hidden="true" />
              生成日记
            </>
          ) : (
            <>
              下一步
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
