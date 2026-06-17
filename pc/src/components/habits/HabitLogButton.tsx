import { format } from 'date-fns';

interface HabitLogButtonProps {
  isLogged: boolean;
  onToggle: () => void;
  date?: string;
}

export default function HabitLogButton({ isLogged, onToggle, date }: HabitLogButtonProps) {
  const displayDate = date || format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted">{displayDate}</span>
      <button
        onClick={onToggle}
        className={`w-8 h-8 rounded-full border-2 transition-all ${
          isLogged
            ? 'bg-primary border-primary text-white'
            : 'hover:border-primary'
        }`}
        style={isLogged ? undefined : { borderColor: 'var(--glass-border)' }}
      >
        {isLogged && (
          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
