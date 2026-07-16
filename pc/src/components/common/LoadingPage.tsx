import { useState, useEffect, useRef } from 'react';
import { Brain, CheckCircle, Zap, AlertCircle } from 'lucide-react';

interface LoadingStep {
  id: string;
  label: string;
  detail?: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

interface LoadingPageProps {
  onComplete: () => void;
}

const ONNX_WEIGHT = 70;  // 70% 进度给 ONNX 加载
const READY_WEIGHT = 30; // 30% 给准备就绪

export default function LoadingPage({ onComplete }: LoadingPageProps) {
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'onnx', label: '加载情感分析模型', detail: 'models/sentiment/sentiment.onnx', status: 'pending' },
    { id: 'ready', label: '准备就绪', status: 'pending' },
  ]);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateStep = (id: string, updates: Partial<LoadingStep>) => {
    setSteps(prev => prev.map(step =>
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  useEffect(() => {
    const preloadModels = async () => {
      // 1. ONNX 情感分析模型
      updateStep('onnx', { status: 'loading' });
      setCurrentFile('models/sentiment/sentiment.onnx');

      // 模拟进度推进（0 → 70%），基于时间
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const fakeProgress = Math.min(ONNX_WEIGHT - 2, elapsed / 200); // 200ms 到约 68%
        setProgress(Math.floor(fakeProgress));
      }, 50);

      let onnxOk = false;
      try {
        if (window.electronAPI?.sentimentGetModelStatus) {
          const status = await window.electronAPI.sentimentGetModelStatus();
          onnxOk = status.onnxLoaded || status.onnxAvailable;
        }
      } catch { /* ignore */ }

      if (timerRef.current) clearInterval(timerRef.current);

      if (onnxOk) {
        updateStep('onnx', { status: 'done' });
        setProgress(ONNX_WEIGHT);
      } else {
        updateStep('onnx', {
          status: 'error',
          detail: '已降级为关键词模式，不影响使用',
        });
        setProgress(ONNX_WEIGHT); // 仍然给满，不阻塞
      }

      // 2. 准备就绪
      updateStep('ready', { status: 'loading' });
      setCurrentFile('');

      // 从 ONNX_WEIGHT 平滑推进到 100%
      const readyStart = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - readyStart;
        const p = Math.min(100, ONNX_WEIGHT + (elapsed / 300) * READY_WEIGHT);
        setProgress(Math.floor(p));
      }, 50);

      // 至少停留 300ms 让用户看到完成状态
      await new Promise(r => setTimeout(r, 300));

      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      updateStep('ready', { status: 'done' });

      // 完成态停留 400ms
      await new Promise(r => setTimeout(r, 400));
      onComplete();
    };

    preloadModels();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onComplete]);

  const getStepIcon = (status: LoadingStep['status']) => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      case 'done':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'var(--bg-gradient)' }}>
      <div className="text-center space-y-8 w-80">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 animate-scale-in">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            FriendOS
          </h1>
        </div>

        {/* 进度条 */}
        <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
              style={{
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>{progress}%</span>
            {currentFile && <span className="truncate ml-2 text-[10px] opacity-60">{currentFile}</span>}
          </div>
        </div>

        {/* 加载步骤 */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-3 px-5 py-2.5 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm backdrop-blur-sm animate-slide-up"
              style={{ animationDelay: `${400 + index * 120}ms` }}
            >
              {getStepIcon(step.status)}
              <div className="text-left">
                <span className={`text-sm font-medium ${
                  step.status === 'done'
                    ? 'text-green-600 dark:text-green-400'
                    : step.status === 'loading'
                      ? 'text-primary'
                      : step.status === 'error'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {step.label}
                </span>
                {step.detail && (
                  <span className={`block text-[11px] ${
                    step.status === 'error' ? 'text-amber-500' : 'text-text-muted'
                  }`}>
                    {step.detail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 提示文字 */}
        <p className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in" style={{ animationDelay: '1200ms' }}>
          首次启动可能需要较长时间，请耐心等待...
        </p>
      </div>
    </div>
  );
}
