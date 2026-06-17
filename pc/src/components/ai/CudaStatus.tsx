import { useState, useEffect } from 'react';
import { Cpu, CheckCircle, XCircle } from 'lucide-react';

interface CudaStatusProps {
  className?: string;
}

export default function CudaStatus({ className = '' }: CudaStatusProps) {
  const [status, setStatus] = useState<CudaStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const api = window.electronAPI;
      if (!api?.getCudaStatus) {
        setChecking(false);
        return;
      }
      try {
        const result = await api.getCudaStatus();
        setStatus(result);
      } catch {
        setStatus({ available: false, gpuDevices: [], supportsGpuOffloading: false });
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, []);

  if (checking) {
    return (
      <div className={`flex items-center gap-2 text-xs text-text-muted ${className}`}>
        <Cpu className="w-3 h-3 animate-pulse" />
        <span>检查 CUDA 状态...</span>
      </div>
    );
  }

  if (status?.available) {
    return (
      <div className={`flex items-center gap-2 text-xs text-green-600 ${className}`}>
        <CheckCircle className="w-3 h-3" />
        <span>CUDA 已启用 ({status.gpuDevices.join(', ')})</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-amber-600 ${className}`}>
      <XCircle className="w-3 h-3" />
      <span>CUDA 不可用，使用 CPU 模式</span>
    </div>
  );
}