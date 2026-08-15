import { useState } from 'react';
import Button from '../common/Button';

/**
 * ScaleForm — 通用 Likert 量表组件（ISI-7 / CD-RISC-10 共用）
 * 单题步进式作答，与 PHQ-9/GAD-7 表单交互一致。
 */

export interface ScaleOption {
  label: string;
  value: number;
}

interface ScaleFormProps {
  questions: string[];
  /** 统一选项，或按题号返回选项（如 ISI-7 第 4/6 题措辞不同） */
  options: ScaleOption[] | ((index: number) => ScaleOption[]);
  instruction: string;
  onComplete: (scores: number[]) => void;
  onCancel: () => void;
}

export default function ScaleForm({ questions, options, instruction, onComplete, onCancel }: ScaleFormProps) {
  const total = questions.length;
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<number[]>(new Array(total).fill(-1));

  const currentOptions = typeof options === 'function' ? options(currentQ) : options;

  const handleSelect = (value: number) => {
    const newScores = [...scores];
    newScores[currentQ] = value;
    setScores(newScores);

    if (currentQ < total - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 200);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const handleNext = () => {
    if (currentQ < total - 1 && scores[currentQ] >= 0) {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleSubmit = () => {
    if (scores.every((s) => s >= 0)) {
      onComplete(scores);
    }
  };

  const allAnswered = scores.every((s) => s >= 0);
  const progress = scores.filter((s) => s >= 0).length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
        <span className="text-sm text-text-muted">{progress}/{total}</span>
      </div>

      {/* Question */}
      <div className="space-y-4">
        <p className="text-sm text-text-muted">{instruction}</p>
        <h3 className="text-lg font-medium text-text-primary">
          {currentQ + 1}. {questions[currentQ]}
        </h3>

        <div className="space-y-2">
          {currentOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                scores[currentQ] === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
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
          {currentQ < total - 1 && scores[currentQ] >= 0 && (
            <Button onClick={handleNext}>下一题</Button>
          )}
          {currentQ === total - 1 && allAnswered && (
            <Button onClick={handleSubmit}>提交评估</Button>
          )}
        </div>
      </div>
    </div>
  );
}
