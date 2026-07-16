import { useState, useEffect, useRef } from 'react';
import { Brain, AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';

const MAX_LOAD_TIME = 30000; // 30 秒超时

interface ModelStatusProps {
  className?: string;
}

export default function ModelStatus({ className = '' }: ModelStatusProps) {
  const [status, setStatus] = useState<'checking' | 'loading' | 'onnx' | 'keyword' | 'unavailable'>('checking');
  const [loadTime, setLoadTime] = useState(0);
  const [chatModelReady, setChatModelReady] = useState<boolean | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // 同时检查聊天模型是否就绪
  useEffect(() => {
    if (window.electronAPI?.localModelList) {
      window.electronAPI.localModelList().then((list: any[]) => {
        setChatModelReady(list.some((m: any) => m.available));
      }).catch(() => setChatModelReady(false));
    }
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.sentimentGetModelStatus) {
      setStatus('unavailable');
      return;
    }

    const checkModel = async () => {
      try {
        const modelStatus = await api.sentimentGetModelStatus();

        if (modelStatus.onnxLoaded) {
          setStatus('onnx');
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        } else if (modelStatus.onnxAvailable) {
          const elapsed = Date.now() - startTimeRef.current;
          // 超时保护：超过 30s 未加载成功，降级
          if (elapsed > MAX_LOAD_TIME) {
            setStatus('keyword');
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            return;
          }
          setStatus('loading');
          // Start timer to show loading duration
          timerRef.current = setInterval(() => {
            setLoadTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }, 1000);
        } else {
          setStatus('keyword');
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
      } catch {
        setStatus('unavailable');
      }
    };

    startTimeRef.current = Date.now();
    checkModel();

    // Poll every 2 seconds until model is loaded
    pollRef.current = setInterval(checkModel, 2000);

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); }
      if (timerRef.current) { clearInterval(timerRef.current); }
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className={`flex items-center gap-2 text-xs text-text-muted ${className}`}>
        <Brain className="w-3 h-3 animate-pulse" />
        <span>检查模型...</span>
      </div>
    );
  }

  if (status === 'onnx') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span className="text-green-600">情感 ONNX 模型已加载</span>
        </div>
        {chatModelReady !== null && (
          <div className="flex items-center gap-2 text-xs">
            {chatModelReady ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-green-600">聊天 Qwen 模型就绪</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-red-500" />
                <span className="text-red-500">聊天 Qwen 模型未找到</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (status === 'loading') {
    const progress = Math.min(90, loadTime * 8);
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center gap-2 text-xs">
          <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
          <span className="text-blue-600">ONNX 模型加载中...</span>
          <span className="text-text-muted">({loadTime}s)</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{
              width: `${progress}%`,
              transition: 'width 1s linear',
            }}
          />
        </div>
        <p className="text-[10px] text-text-muted">
          首次加载约需 10-30 秒，请稍候...
        </p>
      </div>
    );
  }

  if (status === 'keyword') {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <Brain className="w-3 h-3 text-amber-600" />
        <span className="text-amber-600">
          {loadTime >= 30 ? '模型加载超时，已切换关键词模式' : '仅关键词模式'}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-red-600 ${className}`}>
      <AlertCircle className="w-3 h-3" />
      <span>分析服务不可用</span>
    </div>
  );
}
