import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/useLanguage';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AISettingsModal({ open, onClose }: AISettingsModalProps) {
  const { t } = useLanguage();
  const [models, setModels] = useState<LocalModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshStatus = async () => {
    setLoading(true);
    setLastError(null);
    try {
      if (window.electronAPI?.localModelList) {
        const list = await window.electronAPI.localModelList();
        setModels(list);
      }
      if (window.electronAPI?.sentimentGetModelStatus) {
        await window.electronAPI.sentimentGetModelStatus().catch(() => {});
      }
    } catch (err: any) {
      setLastError(err?.message || '无法获取模型状态');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      refreshStatus();
    }
  }, [open]);

  const handleReinit = async () => {
    setLoading(true);
    setLastError(null);
    try {
      // 1. 释放聊天模型
      if (window.electronAPI?.localModelDispose) {
        await window.electronAPI.localModelDispose();
      }
      // 2. 重置 ONNX 情感模型状态（下次使用时重新加载）
      if (window.electronAPI?.sentimentResetOnnx) {
        await window.electronAPI.sentimentResetOnnx().catch(() => {});
      }
      // 3. 重新初始化聊天模型
      if (window.electronAPI?.localModelInit) {
        const result = await window.electronAPI.localModelInit('');
        if (!result.success) {
          setLastError(result.error || '模型初始化失败');
        }
      }
      await refreshStatus();
    } catch (err: any) {
      setLastError(err?.message || '重新初始化失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('settings.ai')}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* 聊天模型状态 */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">聊天模型 (Qwen3.5-0.8B)</h4>
          {models.length === 0 && !loading ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                无法获取模型信息，请确认软件完整安装
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {models.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-3 border ${
                    'border-teal-500/20 bg-teal-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-500" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{m.name}</p>
                        <p className="text-xs text-text-muted">{m.size}</p>
                        {m.path && (
                          <p className="text-[10px] text-text-muted truncate max-w-[280px]" title={m.path}>
                            {m.path}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                      已加载
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {lastError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {lastError}
            </p>
          </div>
        )}

        {/* 模型信息说明 */}
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
          <p className="text-sm text-teal-600 dark:text-teal-400">
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
            使用本地 Qwen3.5-0.8B 模型，回复语气固定为心理咨询师风格，无需联网。如遇"未能生成回复"，请点击重新初始化。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={handleReinit} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            重新初始化
          </Button>
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
}
