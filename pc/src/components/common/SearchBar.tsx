import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = '搜索...' }: SearchBarProps) {
  return (
    <div className="relative" role="search">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-4 py-2 rounded-btn border text-sm
          placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          transition-all"
        style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--border-input)' }}
      />
    </div>
  );
}
