import { type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  shake?: boolean;
}

export default function Textarea({ label, error, shake, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 rounded-btn border text-sm text-text-primary resize-none
          placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          transition-all ${error ? 'border-red-300 bg-red-50 focus:ring-red-300 focus:border-red-400' : ''}
          ${shake ? 'animate-shake' : ''} ${className}`}
        style={error ? undefined : { background: 'var(--bg-card-solid)', borderColor: 'var(--border-input)' }}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
