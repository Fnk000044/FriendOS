<<<<<<< HEAD
import { BookOpen, Wind, ClipboardList, Lightbulb } from 'lucide-react';
=======
import { BookOpen, Wind, ClipboardList } from 'lucide-react';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
import { useLanguage } from '../../i18n/useLanguage';

interface Props {
  onNavigate: (path: string) => void;
}

/**
 * AI 回复后出现的干预快捷入口
<<<<<<< HEAD
 * 让对话不只是聊天，能自然引导到日记/呼吸/评估/知识库等工具
=======
 * 让对话不只是聊天，能自然引导到日记/呼吸/评估等工具
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
 */
export default function QuickReplySuggestions({ onNavigate }: Props) {
  const { t } = useLanguage();

  const suggestions = [
    { icon: BookOpen, label: t('chat.suggest_diary'), path: '/diary/new' },
    { icon: Wind, label: t('chat.suggest_breathing'), path: '/therapy' },
    { icon: ClipboardList, label: t('chat.suggest_assessment'), path: '/assessment' },
<<<<<<< HEAD
    { icon: Lightbulb, label: t('chat.suggest_knowledge'), path: '/knowledge' },
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  ];

  return (
    <div className="flex flex-wrap gap-2 pl-9">
      {suggestions.map(({ icon: Icon, label, path }) => (
        <button
          key={path}
          onClick={() => onNavigate(path)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary border hover:bg-[var(--bg-hover)] hover:text-text-primary transition-colors"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
