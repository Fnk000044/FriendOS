import { useEffect, useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';

interface StorageBreakdown {
  total: number;
  cache: number;
  appData: number;
  logs: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 储存信息卡片：显示 userData 目录实际占用大小（应用数据/缓存/日志）+ 清理缓存按钮
 * 大部分占用来自 Chromium 缓存（Cache/Code Cache/GPUCache），非应用数据本身
 */
export default function StorageInfo() {
  const { t } = useLanguage();
  const [info, setInfo] = useState<StorageBreakdown | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const load = async () => {
    try {
      const result = await window.electronAPI?.getStorageSize?.();
      if (result) setInfo(result);
    } catch (err) {
      console.error('[StorageInfo] getStorageSize failed:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCleanCache = async () => {
    if (cleaning) return;
    setCleaning(true);
    try {
      await window.electronAPI?.clearCache?.();
      await load();
    } catch (err) {
      console.error('[StorageInfo] clearCache failed:', err);
    } finally {
      setCleaning(false);
    }
  };

  if (!info) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">总占用</span>
        <span className="font-semibold text-text-primary">{formatSize(info.total)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">应用数据</span>
        <span className="text-text-secondary">{formatSize(info.appData)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">缓存</span>
        <span className="text-text-secondary">{formatSize(info.cache)}</span>
      </div>
      {info.logs > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">日志</span>
          <span className="text-text-secondary">{formatSize(info.logs)}</span>
        </div>
      )}
      {info.cache > 1024 * 1024 && (
        <button
          type="button"
          onClick={handleCleanCache}
          disabled={cleaning}
          className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
        >
          {cleaning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          {cleaning ? '清理中...' : '清理缓存'}
        </button>
      )}
    </div>
  );
}
