import { useState } from 'react';
import { Phone, Copy, Check } from 'lucide-react';

interface HotlineCardProps {
  name: string;
  number: string;
  description?: string;
}

export default function HotlineCard({ name, number, description }: HotlineCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = number;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-slate-300 transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--glass-border)' }}>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
        <Phone className="w-5 h-5 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{name}</p>
        <p className="text-lg font-bold text-blue-500 tracking-wide">{number}</p>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={handleCopy}
        aria-label={copied ? '已复制' : `复制号码 ${name}`}
        className={`flex-shrink-0 p-2 rounded-md transition-all ${
          copied
            ? 'bg-green-500/10 text-green-500'
            : 'text-text-muted hover:bg-[var(--bg-hover)]'
        }`}
        style={copied ? undefined : { background: 'var(--bg-hover)' }}
        title="复制号码"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
