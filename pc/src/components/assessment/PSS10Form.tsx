import { useState } from 'react';
import Button from '../common/Button';

interface PSS10FormProps {
  onComplete: (scores: number[]) => void;
  onCancel: () => void;
}

// PSS-10 知觉压力量表 (Cohen et al., 1983)
// 中文版参考：王延松等, 2010
const QUESTIONS = [
  '因为发生了意想不到的事情而感到心烦意乱',
  '感到无法控制生活中重要的事情',
  '感到紧张和有压力',
  '成功地处理了生活中恼人的事情（反向计分）',
  '感到自己能有效地应对生活中重要的变化（反向计分）',
  '对自己处理个人问题的能力没有信心',
  '感到事情按照自己的意愿进行（反向计分）',
  '发现自己无法处理所有必须做的事情',
  '能够控制生活中的烦恼（反向计分）',
  '感到困难堆积得太多，无法克服',
];

// 0=从不, 1=偶尔, 2=有时, 3=经常, 4=总是
const OPTIONS = [
  { label: '从不', value: 0 },
  { label: '偶尔', value: 1 },
  { label: '有时', value: 2 },
  { label: '经常', value: 3 },
  { label: '总是', value: 4 },
];

// 反向计分题目索引（0-based）：第4、5、7、8题
const REVERSE_ITEMS = [3, 4, 6, 8];

export default function PSS10Form({ onComplete, onCancel }: PSS10FormProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<number[]>(new Array(10).fill(-1));

  const handleSelect = (value: number) => {
    const newScores = [...scores];
    newScores[currentQ] = value;
    setScores(newScores);

    if (currentQ < 9) {
      setTimeout(() => setCurrentQ(currentQ + 1), 200);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const handleNext = () => {
    if (currentQ < 9 && scores[currentQ] >= 0) {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleSubmit = () => {
    if (scores.every(s => s >= 0)) {
      // 处理反向计分
      const processedScores = scores.map((score, index) =>
        REVERSE_ITEMS.includes(index) ? 4 - score : score
      );
      onComplete(processedScores);
    }
  };

  const allAnswered = scores.every(s => s >= 0);
  const progress = scores.filter(s => s >= 0).length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${(progress / 10) * 100}%` }}
          />
        </div>
        <span className="text-sm text-text-muted">{progress}/10</span>
      </div>

      {/* Question */}
      <div className="space-y-4">
        <p className="text-sm text-text-muted">在过去一个月内，以下情况出现的频率：</p>
        <h3 className="text-lg font-medium text-text-primary">
          {currentQ + 1}. {QUESTIONS[currentQ]}
        </h3>

        <div className="space-y-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                scores[currentQ] === opt.value
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'hover:border-slate-300 hover:bg-slate-50'
              }`}
              style={scores[currentQ] === opt.value ? undefined : { borderColor: 'var(--glass-border)' }}
            >
              <span className="font-medium">{opt.value}</span>
              <span className="ml-2">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>取消</Button>
          {currentQ > 0 && (
            <Button variant="ghost" onClick={handlePrev}>上一题</Button>
          )}
        </div>
        <div className="flex gap-2">
          {currentQ < 9 && scores[currentQ] >= 0 && (
            <Button onClick={handleNext}>下一题</Button>
          )}
          {currentQ === 9 && allAnswered && (
            <Button onClick={handleSubmit}>提交评估</Button>
          )}
        </div>
      </div>
    </div>
  );
}
