import { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, Clock } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { useNotificationStore, type Reminder } from '../../stores/notificationStore';
import { useLanguage } from '../../i18n/useLanguage';

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export default function NotificationSettings() {
  const { reminders, initFromStorage, toggleReminder, removeReminder, addReminder, updateReminder } = useNotificationStore();
  const { t } = useLanguage();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTime, setNewTime] = useState('21:00');
  const [newType, setNewType] = useState<Reminder['type']>('custom');

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;

    addReminder({
      id: `custom-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      body: newBody.trim() || '该做点什么了！',
      time: newTime,
      days: [],
      enabled: true,
    });

    setNewTitle('');
    setNewBody('');
    setNewTime('21:00');
    setShowAdd(false);
  };

  const handleTest = () => {
    window.electronAPI?.notificationTest?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">{t('notification.title')}</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleTest}>{t('notification.test')}</Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4 mr-1" /> {t('notification.add')}
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="space-y-3 border border-primary/20">
          <div className="flex gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as Reminder['type'])}
              className="px-3 py-2 rounded-lg border text-sm text-text-primary"
              style={{ borderColor: 'var(--border-input)', background: 'var(--bg-card-solid)' }}
            >
              <option value="diary">{t('notification.diary')}</option>
              <option value="habit">{t('notification.habit')}</option>
              <option value="custom">{t('notification.custom')}</option>
            </select>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm text-text-primary"
              style={{ borderColor: 'var(--border-input)', background: 'var(--bg-card-solid)' }}
            />
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t('notification.title_placeholder')}
            className="w-full px-3 py-2 rounded-lg border text-sm text-text-primary"
            style={{ borderColor: 'var(--border-input)', background: 'var(--bg-card-solid)' }}
          />
          <input
            type="text"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
              placeholder={t('notification.body_placeholder')}
            className="w-full px-3 py-2 rounded-lg border text-sm text-text-primary"
            style={{ borderColor: 'var(--border-input)', background: 'var(--bg-card-solid)' }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>{t('notification.cancel')}</Button>
            <Button size="sm" onClick={handleAdd}>{t('notification.add')}</Button>
          </div>
        </Card>
      )}

      {/* Reminder list */}
      {reminders.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('notification.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map(reminder => (
            <div
              key={reminder.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                reminder.enabled
                  ? ''
                  : 'opacity-60'
              }`}
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <button
                onClick={() => toggleReminder(reminder.id)}
                className="flex-shrink-0"
              >
                {reminder.enabled ? (
                  <Bell className="w-5 h-5 text-primary" />
                ) : (
                  <BellOff className="w-5 h-5 text-text-muted" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-text-primary">{reminder.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-text-muted">
                    {reminder.type === 'diary' ? t('notification.diary') : reminder.type === 'habit' ? t('notification.habit') : t('notification.custom')}
                  </span>
                </div>
                <p className="text-xs text-text-muted truncate">{reminder.body}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-text-secondary">
                  <Clock className="w-3.5 h-3.5" />
                  {reminder.time}
                </div>
                <button
                  onClick={() => removeReminder(reminder.id)}
                  className="p-1 hover:bg-red-500/10 rounded text-red-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-muted">
        {t('notification.desc')}
      </p>
    </div>
  );
}
