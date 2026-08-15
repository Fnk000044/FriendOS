import { useState } from 'react';
import Button from '../common/Button';

interface CSSRSFormProps {
  onComplete: (scores: number[]) => void;
  onCancel: () => void;
}

/**
 * Columbia Suicide Severity Rating Scale (C-SSRS) 简版
 * 6 题筛查自杀意念与行为，是自杀风险临床筛查金标准。
 *
 * Q1-Q2：被动/主动自杀意念（有任一为"是"即提示风险）
 * Q3-Q4：伴意图/计划的主动意念（"是"为高风险）
 * Q5：自杀行为（"是"为危急，需立即干预）
 * Q6：被动意念频率补充
 *
 * 评分约定：scores[i] = 0(否) / 1(是)，totalScore 为"是"的数量，
 * level 由最高危的题号决定（任一 Q3/Q4/Q5 为"是"即危急）。
 */
const QUESTIONS = [
  '你是否希望自己在睡着后不再醒来？（被动意念）',
  '你是否有过真的想去自杀的想法？（主动意念）',
  '你是否有过这种自杀的想法，并思考过具体怎么做？（伴方法意念）',
  '你是否有过这些想法，并且打算付诸行动？（伴意图意念）',
  '你是否曾实施过自杀行为，或即将实施？（自杀行为）',
  '在过去一个月内，上述想法出现的频率有多高？（0=没有 1=很少 2=有时 3=经常 4=极度频繁）',
];

const OPTIONS_01 = [
  { label: '否', value: 0 },
  { label: '是', value: 1 },
];

const OPTIONS_FREQ = [
  { label: '没有', value: 0 },
  { label: '很少', value: 1 },
  { label: '有时', value: 2 },
  { label: '经常', value: 3 },
  { label: '极度频繁', value: 4 },
];

function optionsFor(index: number) {
  // 前 5 题用 0/1，第 6 题用频率
  return index < 5 ? OPTIONS_01 : OPTIONS_FREQ;
}

export default function CSSRSForm({ onComplete, onCancel }: CSSRSFormProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<number[]>(new Array(6).fill(-1));

  const handleSelect = (value: number) => {
    const newScores = [...scores];
    newScores[currentQ] = value;
    setScores(newScores);

    if (currentQ < 5) {
      setTimeout(() => setCurrentQ(currentQ + 1), 200);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const handleSubmit = () => {
    onComplete(scores);
  };

  const allAnswered = scores.every((s) => s !== -1);
  const options = optionsFor(currentQ);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">C-SSRS 自杀风险筛查</h2>
        <p className="text-xs text-text-muted mt-1">Columbia 自杀严重程度评定量表（简版 6 题）</p>
      </div>

      <div className="flex justify-center gap-1.5">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === currentQ ? 'w-6 bg-primary' : scores[i] !== -1 ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="glass-card rounded-xl p-5">
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          <span className="font-medium text-text-primary">第 {currentQ + 1} 题</span>
          ：{QUESTIONS[currentQ]}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {options.map((opt) => {
            const selected = scores[currentQ] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  selected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-[var(--bg-hover)] text-text-secondary border-transparent hover:bg-[var(--bg-hover)]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={currentQ === 0 ? onCancel : handlePrev}>
          {currentQ === 0 ? '取消' : '上一题'}
        </Button>
        {currentQ === 5 ? (
          <Button variant="primary" onClick={handleSubmit} disabled={!allAnswered}>
            完成评估
          </Button>
        ) : (
          <span className="text-xs text-text-muted self-center">{currentQ + 1} / {QUESTIONS.length}</span>
        )}
      </div>

      <p className="text-[11px] text-text-muted text-center leading-relaxed">
        ⚠️ 若你有自杀想法或处于危机中，请立即拨打全国心理援助热线
        <strong className="text-primary"> 400-161-9995</strong> 或
        <strong className="text-primary"> 北京心理危机研究与干预中心 010-82951332</strong>。
        本量表仅供筛查参考，不能替代专业诊断。
      </p>
    </div>
  );
}
