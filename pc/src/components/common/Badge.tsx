interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const colors = {
  default: 'text-slate-600',
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colors[variant]} ${sizes[size]} ${className}`}
      style={variant === 'default' ? { background: 'var(--bg-hover)', color: 'var(--text-secondary)' } : undefined}
    >
      {children}
    </span>
  );
}
