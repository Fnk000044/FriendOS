import ScaleForm from './ScaleForm';

/**
 * ISI-7 — 失眠严重程度指数（Insomnia Severity Index, Bastien et al., 2001）
 * 7 题，每题 0-4 分，总分 0-28。
 * 分级：0-7 无临床显著失眠 / 8-14 亚临床失眠 / 15-21 中度临床失眠 / 22-28 重度临床失眠
 */

interface ISI7FormProps {
  onComplete: (scores: number[]) => void;
  onCancel: () => void;
}

const QUESTIONS = [
  '入睡困难（从躺下到睡着超过 30 分钟）的程度',
  '睡眠维持困难（夜间醒来或醒得太早）的程度',
  '过早醒来（比预期早醒且无法再入睡）问题的程度',
  '你对当前睡眠模式的满意程度',
  '睡眠问题对你日间功能（注意力、精力、情绪、工作学习）的影响程度',
  '睡眠问题在多大程度上被他人注意到（生活质量受损）',
  '睡眠问题给你带来的困扰或担忧程度',
];

const OPTIONS_FREQ = [
  { label: '无', value: 0 },
  { label: '轻度', value: 1 },
  { label: '中度', value: 2 },
  { label: '重度', value: 3 },
  { label: '极重度', value: 4 },
];

const OPTIONS_SATISFACTION = [
  { label: '非常满意', value: 0 },
  { label: '满意', value: 1 },
  { label: '一般', value: 2 },
  { label: '不满意', value: 3 },
  { label: '非常不满意', value: 4 },
];

const OPTIONS_NOTICEABLE = [
  { label: '完全没有', value: 0 },
  { label: '有一点', value: 1 },
  { label: '有些明显', value: 2 },
  { label: '很明显', value: 3 },
  { label: '非常明显', value: 4 },
];

// 第 4 题（满意度）与第 6 题（被他人注意）使用专属措辞
const optionsFor = (index: number) =>
  index === 3 ? OPTIONS_SATISFACTION : index === 5 ? OPTIONS_NOTICEABLE : OPTIONS_FREQ;

export default function ISI7Form({ onComplete, onCancel }: ISI7FormProps) {
  return (
    <ScaleForm
      questions={QUESTIONS}
      options={optionsFor}
      instruction="请根据最近两周的实际情况作答："
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}
