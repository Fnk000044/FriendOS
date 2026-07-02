import { useState, useEffect } from 'react';
import { Brain, CheckCircle, Zap } from 'lucide-react';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

interface LoadingPageProps {
  onComplete: () => void;
}

export default function LoadingPage({ onComplete }: LoadingPageProps) {
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'onnx', label: '加载情感分析模型', status: 'pending' },
    { id: 'ready', label: '准备就绪', status: 'pending' },
  ]);

  const updateStep = (id: string, status: LoadingStep['status']) => {
    setSteps(prev => prev.map(step =>
      step.id === id ? { ...step, status } : step
    ));
  };

  useEffect(() => {
    const preloadModels = async () => {
      try {
        // 1. 预加载 ONNX 情感分析模型（较轻，保留阻塞）
        updateStep('onnx', 'loading');
        if (window.electronAPI?.sentimentGetModelStatus) {
          await window.electronAPI.sentimentGetModelStatus();
        }
        updateStep('onnx', 'done');

        // 本地 LLM 不再阻塞启动，改为首次发消息时懒初始化（见 useAI.ts）

        // 2. 完成
        updateStep('ready', 'loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStep('ready', 'done');

        // 延迟一下让用户看到完成状态
        await new Promise(resolve => setTimeout(resolve, 800));
        onComplete();
      } catch (err) {
        console.error('[LoadingPage] Preload error:', err);
        // 即使加载失败也继续进入应用
        onComplete();
      }
    };

    preloadModels();
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
        return <Zap className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 animate-fade-in">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 animate-scale-in">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            FriendOS
          </h1>
        </div>

        {/* 加载步骤 */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm backdrop-blur-sm animate-slide-up"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              {getStepIcon(step.status)}
              <span className={`text-sm font-medium ${
                step.status === 'done' 
                  ? 'text-green-600 dark:text-green-400' 
                  : step.status === 'loading'
                    ? 'text-primary'
                    : 'text-gray-600 dark:text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* 提示文字 */}
        <p className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in" style={{ animationDelay: '1500ms' }}>
          首次启动可能需要较长时间，请耐心等待...
        </p>
      </div>
    </div>
  );
}
