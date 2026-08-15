import { type TextareaHTMLAttributes, useId } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  shake?: boolean;
}

export default function Textarea({ label, error, shake, className = '', ...props }: TextareaProps) {
  const autoId = useId();
  const textareaId = props.id || `textarea-${autoId}`;
  return (
    <div className="space-y-1">
      {label && <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">{label}</label>}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 rounded-btn border text-sm text-text-primary resize-none
          placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-all ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''}
          ${shake ? 'animate-shake' : ''} ${className}`}
        style={error ? { background: 'var(--bg-card-solid)', borderColor: '#EF4444' } : { background: 'var(--bg-card-solid)', borderColor: 'var(--border-input)' }}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
