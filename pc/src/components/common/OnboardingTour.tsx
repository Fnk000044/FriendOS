import { useState } from 'react';
import { BookOpen, MessageCircle, Activity, Heart, ChevronRight, ChevronLeft, X } from 'lucide-react';
import Button from './Button';

interface OnboardingTourProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: BookOpen,
    color: '#8B5CF6',
    title: '写日记，记录生活',
    description: '每天花几分钟写下你的想法和感受。系统会无感知地分析你的情绪状态，无需填写任何问卷。',
    tip: '日记是你与自己对话的方式',
  },
  {
    icon: MessageCircle,
    color: '#8B5CF6',
    title: 'AI 助手，随时陪伴',
    description: '与 AI 聊天获得心理支持。AI 会记住你们的对话，在你情绪低落时主动关心你。',
    tip: '支持多种对话风格，包括心理咨询师模式',
  },
  {
    icon: Activity,
    color: '#F43F5E',
    title: '情绪分析，无感识别',
    description: '通过你日常的写作、聊天、任务完成等行为，自动分析心理健康状况，生成情绪趋势图和健康画像。',
    tip: '完全无感知，不干扰你的正常使用',
  },
  {
    icon: Heart,
    color: '#EC4899',
    title: '治疗练习，自我关怀',
    description: '提供 CBT 思维记录、呼吸练习、正念冥想等专业工具，帮助你更好地管理情绪。',
    tip: '发现高风险时会自动弹出危机干预',
  },
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card glass-glow rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-8 bg-primary' : i < currentStep ? 'w-4 bg-primary/40' : 'w-4'
                }`}
                style={i >= currentStep ? undefined : { background: 'var(--bg-hover)' }}
              />
            ))}
          </div>
          <button
            onClick={onComplete}
            className="p-1 rounded-lg text-text-muted"
            style={{ background: 'transparent' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center space-y-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: `${step.color}15` }}
          >
            <Icon className="w-10 h-10" style={{ color: step.color }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">{step.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
          </div>

          <div className="rounded-lg px-4 py-3" style={{ background: 'var(--bg-hover)' }}>
            <p className="text-xs text-text-muted">💡 {step.tip}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between">
          {currentStep > 0 ? (
            <Button variant="ghost" onClick={() => setCurrentStep(currentStep - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> 上一步
            </Button>
          ) : (
            <div />
          )}

          {isLast ? (
            <Button onClick={onComplete}>
              开始使用
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              下一步 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
