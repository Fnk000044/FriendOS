import type { Task } from '../db/models';
import { DEFAULT_CATEGORIES } from './constants';

export const PRIORITY_CONFIG: Record<string, { key: 'task.urgent' | 'task.high' | 'task.medium' | 'task.low'; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  urgent: { key: 'task.urgent', variant: 'danger' },
  high: { key: 'task.high', variant: 'warning' },
  medium: { key: 'task.medium', variant: 'info' },
  low: { key: 'task.low', variant: 'default' },
};

export const PRIORITY_KEYS: Record<Task['priority'], 'task.urgent' | 'task.high' | 'task.medium' | 'task.low'> = {
  urgent: 'task.urgent',
  high: 'task.high',
  medium: 'task.medium',
  low: 'task.low',
};

export const PRIORITY_DEFAULT_COLORS: Record<Task['priority'], string> = {
  urgent: 'border-red-200 text-red-500 hover:bg-red-50',
  high: 'border-orange-200 text-orange-500 hover:bg-orange-50',
  medium: 'border-blue-200 text-blue-500 hover:bg-blue-50',
  low: 'border-slate-200 text-slate-400 hover:bg-slate-50',
};

export const PRIORITY_ACTIVE_COLORS: Record<Task['priority'], string> = {
  urgent: 'bg-red-500 text-white border-red-500',
  high: 'bg-orange-500 text-white border-orange-500',
  medium: 'bg-blue-500 text-white border-blue-500',
  low: 'bg-slate-400 text-white border-slate-400',
};

export const CATEGORY_COLOR_MAP: Record<string, string> = {};
for (const cat of DEFAULT_CATEGORIES) {
  CATEGORY_COLOR_MAP[cat.name] = cat.color;
}
