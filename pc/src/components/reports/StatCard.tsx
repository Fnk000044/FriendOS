import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
}

const StatCard = React.memo(function StatCard({ label, value, suffix, color = '#14B8A6' }: StatCardProps) {
  return (
    <div className="glass-card p-5">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        {suffix && <span className="text-sm text-text-muted mb-0.5">{suffix}</span>}
      </div>
    </div>
  );
});

export default StatCard;
