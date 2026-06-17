import { useState } from 'react';
import { BookOpen, Heart, Star, Moon, Lightbulb } from 'lucide-react';

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
      '今天值得感恩的 3 件事：',
      '1. ',
      '2. ',
      '3. ',
      '\n为什么这些事让我感到感恩？',
    ],
    color: 'bg-pink-50 text-pink-600 border-pink-200',
  },
  {
    id: 'achievement',
    name: '成就日记',
    icon: <Star className="w-5 h-5" />,
    description: '记录今天完成的事',
    prompts: [
      '今天完成的 3 件事：',
      '1. ',
      '2. ',
      '3. ',
      '\n为自己感到骄傲的原因：',
    ],
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  },
  {
    id: 'emotion_trigger',
    name: '情绪触发分析',
    icon: <Lightbulb className="w-5 h-5" />,
    description: '分析情绪产生的原因',
    prompts: [
      '【事件】发生了什么？',
      '',
      '【想法】当时脑海中浮现了什么？',
      '',
      '【情绪】感受如何？（可以用 1-10 分表示强度）',
      '',
      '【行为】我做了什么？',
      '',
      '【下次】下次遇到类似情况，我可以怎么做？',
    ],
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    id: 'goodnight',
    name: '晚安日记',
    icon: <Moon className="w-5 h-5" />,
    description: '用美好的心情结束今天',
    prompts: [
      '今天最开心的一件事：',
      '',
      '今天学到了什么：',
      '',
      '明天想做的一件事：',
      '',
      '晚安，对自己说一句话：',
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
      <h3 className="text-sm font-medium text-slate-600">选择日记模板</h3>
      <div className="grid grid-cols-2 gap-2">
        {JOURNAL_TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:shadow-sm ${
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
