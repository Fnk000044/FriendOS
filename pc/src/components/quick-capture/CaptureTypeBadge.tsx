import type { CaptureType } from '../../utils/classification';
import { useLanguage } from '../../i18n/useLanguage';

interface Props {
  type: CaptureType;
}

const colorConfig: Record<CaptureType, string> = {
  todo: 'bg-blue-50 text-blue-600',
  diary: 'bg-green-50 text-green-600',
  idea: 'bg-amber-50 text-amber-600',
  memory: 'bg-purple-50 text-purple-600',
  uncategorized: 'bg-slate-50 text-slate-500',
};

const typeKeyMap: Record<CaptureType, 'quick_capture.todo' | 'quick_capture.diary' | 'quick_capture.idea' | 'quick_capture.memory' | 'quick_capture.uncategorized'> = {
  todo: 'quick_capture.todo',
  diary: 'quick_capture.diary',
  idea: 'quick_capture.idea',
  memory: 'quick_capture.memory',
  uncategorized: 'quick_capture.uncategorized',
};

export default function CaptureTypeBadge({ type }: Props) {
  const { t } = useLanguage();
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorConfig[type]}`}>
      {t(typeKeyMap[type])}
    </span>
  );
}
