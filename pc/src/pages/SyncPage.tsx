import { useState, useEffect, useCallback } from 'react';
import { Smartphone, Copy, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { db } from '../db';
import { useLanguage } from '../i18n/useLanguage';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';

export default function SyncPage() {
  const { t } = useLanguage();
  const isElectron = !!window.electronAPI?.startSyncServer;

  const [serverStatus, setServerStatus] = useState<SyncServerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const syncLogs = useLiveQuery(
    () => db.syncLogs.orderBy('syncedAt').reverse().limit(20).toArray(),
  );

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.getSyncStatus().then(setServerStatus);

    const onStatus = api.onSyncStatusChanged;
    if (onStatus) {
      onStatus((status) => setServerStatus(status));
    }

    return () => {
      if (api.removeSyncStatusChanged) api.removeSyncStatusChanged();
    };
  }, []);

  // Generate QR code when server is running
  useEffect(() => {
    if (serverStatus?.running && serverStatus.ip && serverStatus.port && serverStatus.token) {
      const data = JSON.stringify({
        ip: serverStatus.ip,
        port: serverStatus.port,
        token: serverStatus.token,
      });
      QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: { dark: '#1E293B', light: '#FFFFFF' },
      }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [serverStatus?.running, serverStatus?.ip, serverStatus?.port, serverStatus?.token]);

  const handleStart = useCallback(async () => {
    setLoading(true);
    try {
      const status = await window.electronAPI!.startSyncServer();
      setServerStatus(status);
      if (!status.running) {
        toast.error(status.error || 'Failed to start server');
      } else {
        toast.success(t('sync.server_status_running'));
      }
    } catch (err: unknown) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleStop = useCallback(async () => {
    setLoading(true);
    try {
      await window.electronAPI!.stopSyncServer();
      toast.success(t('sync.server_status_stopped'));
    } catch (err: unknown) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const copyConnectionInfo = useCallback(() => {
    if (!serverStatus?.running) return;
    const text = `${serverStatus.ip}:${serverStatus.port}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [serverStatus]);

  if (!isElectron) {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <EmptyState
          icon={<Smartphone className="w-12 h-12 text-text-muted" />}
          title="需要桌面应用"
          description="此功能需要 Electron 桌面环境支持"
        />
      </div>
    );
  }

  const running = serverStatus?.running ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{t('sync.title')}</h2>
        <p className="text-sm text-text-muted mt-1">{t('sync.description')}</p>
      </div>

      {/* Server Controls */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {running ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-slate-300" />
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">
                {running ? t('sync.server_status_running') : t('sync.server_status_stopped')}
              </p>
              {running && serverStatus && (
                <p className="text-xs text-text-muted mt-0.5">
                  {serverStatus.ip}:{serverStatus.port}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={running ? handleStop : handleStart}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              running
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-primary text-white hover:bg-primary-dark'
            } disabled:opacity-50`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                ...
              </span>
            ) : running ? (
              t('sync.stop_server')
            ) : (
              t('sync.start_server')
            )}
          </button>
        </div>
      </Card>

      {/* QR Code + Connection Info */}
      {running && qrDataUrl && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-text-primary">{t('sync.scan_to_connect')}</p>
              <img
                src={qrDataUrl}
                alt="Sync QR Code"
                className="w-48 h-48 rounded-lg"
              />
            </div>
          </Card>
          <Card>
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-primary">{t('sync.network_info')}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted block mb-1">{t('sync.ip_address')}</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-surface-base rounded-lg text-sm font-mono">
                      {serverStatus!.ip}
                    </code>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">{t('sync.port')}</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-surface-base rounded-lg text-sm font-mono">
                      {serverStatus!.port}
                    </code>
                    <button
                      onClick={copyConnectionInfo}
                      className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                      title="Copy"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sync History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-primary">{t('sync.title')} 记录</h3>
          {syncLogs && syncLogs.length > 0 && (
            <Badge variant="info" size="sm">
              {syncLogs.length}
            </Badge>
          )}
        </div>

        {syncLogs === undefined ? (
          <LoadingSpinner />
        ) : syncLogs.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Smartphone className="w-10 h-10 text-text-muted" />}
              title={t('sync.no_synced_items')}
            />
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-3 py-2.5 bg-surface-base rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {log.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <ExternalLink className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                  <div className="text-sm">
                    <span className="text-text-primary">
                      {t('sync.received_items', { count: log.items.length })}
                    </span>
                    <span className="text-text-muted ml-2">
                      {new Date(log.syncedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={log.status === 'success' ? 'success' : 'warning'}
                  size="sm"
                >
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
