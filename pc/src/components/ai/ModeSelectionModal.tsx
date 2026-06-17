import { useState } from 'react';
import { Cloud, HardDrive, X } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface ModeSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectOnline: () => void;
  onSelectOffline: () => void;
}

export default function ModeSelectionModal({ open, onClose, onSelectOnline, onSelectOffline }: ModeSelectionModalProps) {
  const [hovered, setHovered] = useState<'online' | 'offline' | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="选择 AI 运行模式"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          请选择 AI 助手 的运行模式
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              onSelectOnline();
              onClose();
            }}
            onMouseEnter={() => setHovered('online')}
            onMouseLeave={() => setHovered(null)}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              hovered === 'online'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'hover:border-slate-300'
            }`}
            style={hovered === 'online' ? undefined : { borderColor: 'var(--glass-border)' }}
          >
            <Cloud className="w-10 h-10 mb-3 text-blue-500" />
            <h3 className="font-semibold text-base mb-1">在线模式</h3>
            <p className="text-xs text-text-muted">使用 DeepSeek API 服务，需要网络连接</p>
          </button>

          <button
            onClick={() => {
              onSelectOffline();
              onClose();
            }}
            onMouseEnter={() => setHovered('offline')}
            onMouseLeave={() => setHovered(null)}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              hovered === 'offline'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'hover:border-slate-300'
            }`}
            style={hovered === 'offline' ? undefined : { borderColor: 'var(--glass-border)' }}
          >
            <HardDrive className="w-10 h-10 mb-3 text-green-500" />
            <h3 className="font-semibold text-base mb-1">离线模式</h3>
            <p className="text-xs text-text-muted">使用本地模型，无需网络，保护隐私</p>
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700">
            💡 在线模式需要配置 API Key，离线模式使用本地模型（Qwen3-0.6B）
          </p>
        </div>
      </div>
    </Modal>
  );
}