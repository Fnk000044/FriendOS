import ScaleForm from './ScaleForm';

/**
 * CD-RISC-10 — 心理韧性量表（Connor-Davidson Resilience Scale, 10 题版；
 * Campbell-Sills & Stein, 2007），每题 0-4 分，总分 0-40，分数越高韧性越强。
 * 参考常模（社区样本均值约 30）：≤22 韧性偏低 / 23-29 中等 / ≥30 良好。
 */

interface CDRISC10FormProps {
  onComplete: (scores: number[]) => void;
  onCancel: () => void;
}

const QUESTIONS = [
  '我能够适应变化',
  '无论发生什么，我都能应对',
  '我尝试看到事情幽默的一面',
  '应对压力会让我变得更强大',
  '在生病或经历困难之后，我往往能恢复过来',
  '即使有障碍，我也能实现自己的目标',
  '在压力下，我能够保持专注、思路清晰',
  '我不会轻易被失败打倒',
  '我认为自己是一个坚强的人',
  '我能够处理不愉快的情绪（如悲伤、害怕、愤怒）',
];

const OPTIONS = [
  { label: '从不', value: 0 },
  { label: '很少', value: 1 },
  { label: '有时', value: 2 },
  { label: '经常', value: 3 },
  { label: '几乎总是', value: 4 },
];

export default function CDRISC10Form({ onComplete, onCancel }: CDRISC10FormProps) {
  return (
    <ScaleForm
      questions={QUESTIONS}
      options={OPTIONS}
      instruction="请根据最近一个月的实际情况作答："
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}
