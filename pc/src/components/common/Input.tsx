import { type InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  shake?: boolean;
}

export default function Input({ label, error, shake, className = '', ...props }: InputProps) {
  const autoId = useId();
  const inputId = props.id || `input-${autoId}`;
  return (
    <div className={`space-y-1 ${shake ? 'animate-shake' : ''}`}>
      {label && <label htmlFor={inputId} className="text-sm font-medium text-text-primary">{label}</label>}
      <input
        id={inputId}
        className={`w-full px-3 py-2.5 rounded-btn border text-sm text-text-primary
          placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-all duration-200 ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''} ${className}`}
        style={{ background: 'var(--bg-card-solid)', borderColor: error ? undefined : 'var(--border-input)' }}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
