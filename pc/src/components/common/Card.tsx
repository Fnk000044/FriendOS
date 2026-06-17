interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? '可点击卡片' : undefined}
      className={`
        glass-card glass-glow p-5
        ${hover ? 'glass-card-hover cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
}
