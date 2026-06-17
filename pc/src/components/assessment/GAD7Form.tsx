import { useState } from 'react';
import Button from '../common/Button';

interface GAD7FormProps {
  onComplete: (scores: number[]) => void;
  onCancel: () => void;
}

const QUESTIONS = [
  '感觉紧张、焦虑或急切',
  '不能够停止或控制担忧',
  '对各种各样的事情担忧过多',
  '很难放松下来',
  '由于不安而无法静坐',
  '变得容易烦恼或急躁',
  '感到似乎将有可怕的事情发生',
];

const OPTIONS = [
  { label: '完全不会', value: 0 },
  { label: '好几天', value: 1 },
  { label: '一半以上的天数', value: 2 },
  { label: '几乎每天', value: 3 },
];

export default function GAD7Form({ onComplete, onCancel }: GAD7FormProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<number[]>(new Array(7).fill(-1));

  const handleSelect = (value: number) => {
    const newScores = [...scores];
    newScores[currentQ] = value;
    setScores(newScores);

    if (currentQ < 6) {
      setTimeout(() => setCurrentQ(currentQ + 1), 200);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const handleNext = () => {
    if (currentQ < 6 && scores[currentQ] >= 0) {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleSubmit = () => {
    if (scores.every(s => s >= 0)) {
      onComplete(scores);
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
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(progress / 7) * 100}%` }}
          />
        </div>
        <span className="text-sm text-text-muted">{progress}/7</span>
      </div>

      {/* Question */}
      <div className="space-y-4">
        <p className="text-sm text-text-muted">在过去两周内，以下情况出现的频率：</p>
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
          {currentQ < 6 && scores[currentQ] >= 0 && (
            <Button onClick={handleNext}>下一题</Button>
          )}
          {currentQ === 6 && allAnswered && (
            <Button onClick={handleSubmit}>提交评估</Button>
          )}
        </div>
      </div>
    </div>
  );
}
