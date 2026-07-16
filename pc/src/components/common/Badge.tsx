interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const colors = {
  default: 'text-slate-600 dark:text-slate-300',
  success: 'text-white',
  warning: 'text-white',
  danger: 'text-white',
  info: 'text-white',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

const variantStyles: Record<NonNullable<BadgeProps['variant']>, React.CSSProperties> = {
  default: {},
  success: { backgroundColor: 'var(--color-success)' },
  warning: { backgroundColor: 'var(--color-warning)' },
  danger: { backgroundColor: 'var(--color-danger)' },
  info: { backgroundColor: 'var(--color-info)' },
};

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colors[variant]} ${sizes[size]} ${className}`}
      style={variant === 'default' ? { background: 'var(--bg-hover)', color: 'var(--text-secondary)' } : variantStyles[variant]}
    >
      {children}
    </span>
  );
}
