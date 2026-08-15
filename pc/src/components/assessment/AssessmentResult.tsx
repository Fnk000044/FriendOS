import Button from '../common/Button';

interface AssessmentResultProps {
  type: 'PHQ9' | 'GAD7' | 'PSS10' | 'CSSRS' | 'ISI7' | 'CDRISC10';
  scores: number[];
  totalScore: number;
  level: string;
  onClose: () => void;
  onRetake: () => void;
}

const PHQ9_LEVELS: Record<string, { label: string; color: string; description: string; suggestion: string }> = {
  minimal: { label: '无症状', color: '#10B981', description: '总分 0-4 分', suggestion: '当前无明显抑郁症状，继续保持良好状态。' },
  mild: { label: '轻度', color: '#F59E0B', description: '总分 5-9 分', suggestion: '存在轻度抑郁倾向，建议关注情绪变化，适当运动和社交。' },
  moderate: { label: '中度', color: '#F97316', description: '总分 10-14 分', suggestion: '存在中度抑郁症状，建议寻求心理咨询帮助。' },
  moderately_severe: { label: '中重度', color: '#EF4444', description: '总分 15-19 分', suggestion: '存在中重度抑郁症状，强烈建议寻求专业心理咨询。' },
  severe: { label: '重度', color: '#DC2626', description: '总分 20-27 分', suggestion: '存在重度抑郁症状，请尽快寻求专业心理帮助。' },
};

const GAD7_LEVELS: Record<string, { label: string; color: string; description: string; suggestion: string }> = {
  minimal: { label: '无症状', color: '#10B981', description: '总分 0-4 分', suggestion: '当前无明显焦虑症状，继续保持良好状态。' },
  mild: { label: '轻度', color: '#F59E0B', description: '总分 5-9 分', suggestion: '存在轻度焦虑倾向，建议适当放松和休息。' },
  moderate: { label: '中度', color: '#F97316', description: '总分 10-14 分', suggestion: '存在中度焦虑症状，建议寻求心理咨询帮助。' },
  severe: { label: '重度', color: '#EF4444', description: '总分 15-21 分', suggestion: '存在重度焦虑症状，请尽快寻求专业心理帮助。' },
};

const PSS10_LEVELS: Record<string, { label: string; color: string; description: string; suggestion: string }> = {
  low: { label: '低压力', color: '#10B981', description: '总分 0-13 分', suggestion: '你目前的知觉压力水平较低，应对能力良好，继续保持健康的生活方式。' },
  moderate: { label: '中等压力', color: '#F59E0B', description: '总分 14-26 分', suggestion: '你感受到中等程度的压力，建议尝试呼吸练习、正念冥想或适度运动来缓解。' },
  high: { label: '高压力', color: '#EF4444', description: '总分 27-40 分', suggestion: '你目前承受较高的压力，建议寻求支持，尝试放松技巧，必要时咨询心理专业人士。' },
};

const CSSRS_LEVELS: Record<string, { label: string; color: string; description: string; suggestion: string }> = {
  low: { label: '低风险', color: '#10B981', description: '未检出自杀意念', suggestion: '当前未检出明显自杀风险，继续保持关注自身情绪状态。' },
  high: { label: '高风险', color: '#EF4444', description: '检出自杀意念', suggestion: '检出自杀相关意念，建议尽快寻求专业心理帮助或拨打心理援助热线：400-161-9995。' },
  critical: { label: '危机', color: '#DC2626', description: '检出自杀意念伴意图/计划', suggestion: '检出严重自杀风险（伴意图或计划），请立即联系信任的人或拨打心理援助热线：400-161-9995，或前往最近的精神卫生中心。' },
};

const ISI7_LEVELS: Record<string, { label: string; color: string; description: string; suggestion: string }> = {
  none: { label: '无临床显著失眠', color: '#10B981', description: '总分 0-7 分', suggestion: '当前无明显失眠问题，继续保持规律作息。' },
  subclinical: { label: '亚临床失眠', color: '#F59E0B', description: '总分 8-14 分', suggestion: '存在轻度睡眠困扰，建议固定作息时间、睡前一小时减少屏幕使用。' },
  moderate: { label: '中度临床失眠', color: '#F97316', description: '总分 15-21 分', suggestion: '失眠问题已对生活造成影响，建议关注睡眠卫生，必要时寻求专业帮助。' },
  severe: { label: '重度临床失眠', color: '#EF4444', description: '总分 22-28 分', suggestion: '失眠问题较严重，强烈建议咨询医生或睡眠专科，避免自行滥用助眠药物。' },
};

const CDRISC_LEVELS: Record<string, { label: string; color: string; description: string; suggestion: string }> = {
  low: { label: '韧性偏低', color: '#F97316', description: '总分 0-22 分', suggestion: '当前心理复原力偏低，可以从小目标开始积累成功体验，必要时寻求社会支持。' },
  moderate: { label: '中等', color: '#F59E0B', description: '总分 23-29 分', suggestion: '心理韧性处于中等水平，规律运动、正念练习与支持性关系有助于进一步提升。' },
  high: { label: '良好', color: '#10B981', description: '总分 30-40 分', suggestion: '心理韧性良好，继续保持积极应对方式与健康生活习惯。' },
};

function getLevel(type: string, score: number, levelStr?: string) {
  if (type === 'PHQ9') {
    if (score <= 4) return PHQ9_LEVELS.minimal;
    if (score <= 9) return PHQ9_LEVELS.mild;
    if (score <= 14) return PHQ9_LEVELS.moderate;
    if (score <= 19) return PHQ9_LEVELS.moderately_severe;
    return PHQ9_LEVELS.severe;
  } else if (type === 'GAD7') {
    if (score <= 4) return GAD7_LEVELS.minimal;
    if (score <= 9) return GAD7_LEVELS.mild;
    if (score <= 14) return GAD7_LEVELS.moderate;
    return GAD7_LEVELS.severe;
  } else if (type === 'CSSRS') {
    // C-SSRS 按 level 字符串判定（critical > high > low）
    if (levelStr === 'critical') return CSSRS_LEVELS.critical;
    if (levelStr === 'high') return CSSRS_LEVELS.high;
    return CSSRS_LEVELS.low;
  } else if (type === 'ISI7') {
    if (score <= 7) return ISI7_LEVELS.none;
    if (score <= 14) return ISI7_LEVELS.subclinical;
    if (score <= 21) return ISI7_LEVELS.moderate;
    return ISI7_LEVELS.severe;
  } else if (type === 'CDRISC10') {
    if (score <= 22) return CDRISC_LEVELS.low;
    if (score <= 29) return CDRISC_LEVELS.moderate;
    return CDRISC_LEVELS.high;
  } else {
    if (score <= 13) return PSS10_LEVELS.low;
    if (score <= 26) return PSS10_LEVELS.moderate;
    return PSS10_LEVELS.high;
  }
}

export default function AssessmentResult({ type, scores, totalScore, level: levelStr, onClose, onRetake }: AssessmentResultProps) {
  const level = getLevel(type, totalScore, levelStr);
  const typeName = type === 'PHQ9' ? 'PHQ-9 抑郁筛查' : type === 'GAD7' ? 'GAD-7 焦虑筛查' : type === 'CSSRS' ? 'C-SSRS 自杀风险筛查' : type === 'PSS10' ? 'PSS-10 压力评估' : type === 'ISI7' ? 'ISI-7 失眠严重程度' : 'CD-RISC-10 心理韧性';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-text-primary">{typeName}结果</h3>
        <p className="text-sm text-text-muted">{level.description}</p>
      </div>

      {/* Score display */}
      <div className="flex justify-center">
        <div
          className="w-32 h-32 rounded-full flex flex-col items-center justify-center border-4"
          style={{ borderColor: level.color }}
        >
          <span className="text-3xl font-bold" style={{ color: level.color }}>{totalScore}</span>
          <span className="text-sm text-text-muted">总分</span>
        </div>
      </div>

      {/* Level label */}
      <div className="text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: level.color }}
        >
          {level.label}
        </span>
      </div>

      {/* Suggestion */}
      <div className="rounded-lg p-4" style={{ background: 'var(--bg-hover)' }}>
        <p className="text-sm text-text-secondary leading-relaxed">{level.suggestion}</p>
      </div>

      {/* Score breakdown */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-primary">各题得分：</p>
        <div className="grid grid-cols-3 gap-2">
          {scores.map((score, i) => (
            <div key={i} className="flex items-center gap-1 text-sm">
              <span className="text-text-muted">Q{i + 1}:</span>
              <span className="font-medium">{score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-700">
          ⚠️ 本评估仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询专业心理健康从业者。
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button variant="ghost" onClick={onRetake}>重新测评</Button>
        <Button onClick={onClose}>完成</Button>
      </div>
    </div>
  );
}
