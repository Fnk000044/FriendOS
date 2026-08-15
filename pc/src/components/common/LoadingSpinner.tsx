import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

export default function LoadingSpinner({ size = 24, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted">
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
      {text && <p className="text-sm mt-3">{text}</p>}
    </div>
  );
}
