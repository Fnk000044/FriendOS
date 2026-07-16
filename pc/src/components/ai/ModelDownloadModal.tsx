import { useState, useEffect, useMemo } from 'react';
import { Download, Check, HardDrive, Loader } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAIStore } from '../../stores/aiStore';
import { useLanguage } from '../../i18n/useLanguage';

interface ModelDownloadModalProps {
  open: boolean;
  onClose: () => void;
  onSelectModel: (modelId: string, modelPath: string) => void;
}

interface ModelInfo {
  id: string;
  name: string;
  size: string;
  path: string;
  available?: boolean;
}

function getModelDir(filePath: string): string {
  const idx = filePath.lastIndexOf('\\');
  const idx2 = filePath.lastIndexOf('/');
  const sep = Math.max(idx, idx2);
  return sep >= 0 ? filePath.substring(0, sep) : filePath;
}

export default function ModelDownloadModal({ open, onClose, onSelectModel }: ModelDownloadModalProps) {
  const { t } = useLanguage();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const localModel = useAIStore((s) => s.config.localModel);
  const setLocalModelReady = useAIStore((s) => s.setLocalModelReady);
  const setLocalModel = useAIStore((s) => s.setLocalModel);

  const modelsDir = useMemo(() => {
    const withPath = models.find((m) => m.path);
    return withPath ? getModelDir(withPath.path) : '';
  }, [models]);

  useEffect(() => {
    if (open) {
      loadModels();
    }
  }, [open]);

  const loadModels = async () => {
    setLoading(true);
    try {
      if (window.electronAPI?.localModelList) {
        const availableModels = await window.electronAPI.localModelList();
        setModels(availableModels);
      } else {
        // Fallback: use the first model from registry (qwen3.5:0.8b)
        setModels([
          { id: 'qwen3.5:0.8b', name: 'Qwen3.5 0.8B', size: '507 MB', path: 'models/Qwen3.5-0.8B-IQ4_NL.gguf', available: true },
        ]);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    }
    setLoading(false);
  };

  const handleSelectModel = async (model: ModelInfo) => {
    setSelectedModel(model.id);

    setLocalModel({
      id: model.id,
      name: model.name,
      size: model.size,
      path: model.path,
      blobPath: model.path,
    });
    setLocalModelReady(true);

    onSelectModel(model.id, model.path);
    onClose();
  };

  const isSelected = (modelId: string) => localModel?.id === modelId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('model_download.title')}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {t('model_download.select')}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-text-muted">{t('model_download.loading')}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelectModel(model)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected(model.id)
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-slate-300'
                }`}
                style={isSelected(model.id) ? undefined : { borderColor: 'var(--glass-border)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm mb-0.5">{model.name}</h3>
                    <p className="text-xs text-text-muted">
                      ≈ {model.size}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected(model.id) ? (
                      <span className="flex items-center text-xs text-primary">
                        <Check className="w-4 h-4 mr-1" />
                        {t('model_download.selected')}
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-text-muted">
                        <Download className="w-4 h-4 mr-1" />
                        {t('model_download.use_model')}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-lg p-3" style={{ background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}>
          <p className="text-xs text-text-muted flex items-center">
            <HardDrive className="w-3.5 h-3.5 mr-1" />
            {modelsDir ? `${t('model_download.path')}: ${modelsDir}` : t('model_download.path')}
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('model_download.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}