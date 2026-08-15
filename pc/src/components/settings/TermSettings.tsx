import { useState, useEffect } from 'react';
import { Calendar, GraduationCap } from 'lucide-react';
import Card from '../common/Card';
import {
  getTermConfig,
  setTermConfig,
  getTermPhaseDescription,
  type TermConfig,
} from '../../services/emotion/StudentAdaptationService';
import { useLanguage } from '../../i18n/useLanguage';

/**
 * 学期设置卡片（SettingsPage 用）
 * 配置开学日 / 考试周起止，替代硬编码月份
 */
export default function TermSettings() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<TermConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(getTermConfig());
  }, []);

  const handleSave = () => {
    if (!config) return;
    setTermConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const phaseInfo = getTermPhaseDescription();

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
        <GraduationCap className="w-4 h-4" />
        学期设置
      </h3>
      <p className="text-xs text-text-muted mb-4">
        配置校历后，应用能更准确识别考试周并调整应激评估。未配置时使用默认校历。
      </p>

      {/* 当前阶段提示 */}
      <div className="mb-4 p-2.5 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg-hover)' }}>
        <Calendar className="w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
        <span className="text-xs text-text-secondary">
          当前阶段：<span className="font-medium text-text-primary">{phaseInfo.label}</span>
          {phaseInfo.daysToExams !== null && (
            <span className="text-text-muted ml-2">距考试 {phaseInfo.daysToExams} 天</span>
          )}
          <span className="text-text-muted ml-2">应激 {phaseInfo.stressLevel}/100</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">开学日期</label>
          <input
            type="date"
            value={config?.termStart || ''}
            onChange={(e) => setConfig({ ...(config || {} as TermConfig), termStart: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-btn border outline-none focus:border-primary"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-input)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">考试周开始</label>
          <input
            type="date"
            value={config?.examWeekStart || ''}
            onChange={(e) => setConfig({ ...(config || {} as TermConfig), examWeekStart: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-btn border outline-none focus:border-primary"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-input)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">考试周结束</label>
          <input
            type="date"
            value={config?.examWeekEnd || ''}
            onChange={(e) => setConfig({ ...(config || {} as TermConfig), examWeekEnd: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-btn border outline-none focus:border-primary"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-input)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">假期开始（可选）</label>
          <input
            type="date"
            value={config?.vacationStart || ''}
            onChange={(e) => setConfig({ ...(config || {} as TermConfig), vacationStart: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-btn border outline-none focus:border-primary"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-input)' }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!config?.termStart || !config?.examWeekStart || !config?.examWeekEnd}
          className="px-3 py-1.5 text-xs text-white rounded-btn disabled:opacity-40"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {saved ? '已保存 ✓' : '保存'}
        </button>
        {config && (
          <button
            type="button"
            onClick={() => { localStorage.removeItem('friendos_term_config'); setConfig(null); }}
            className="px-3 py-1.5 text-xs text-text-muted border rounded-btn hover:bg-[var(--bg-hover)]"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            清除配置
          </button>
        )}
      </div>
    </Card>
  );
}
