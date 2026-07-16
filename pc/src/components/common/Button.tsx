import { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary: 'text-white hover:shadow-md',
  secondary: 'text-text-primary border hover:border-primary/20',
  ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-btn transition-all duration-200 active:scale-[0.97]
        ${variants[variant]} ${sizes[size]} disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      style={variant === 'primary' ? { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' } : variant === 'secondary' ? { background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' } : undefined}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
