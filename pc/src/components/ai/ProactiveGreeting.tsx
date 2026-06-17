import { useState, useEffect, useRef } from 'react';
import { Heart, X, MessageCircle } from 'lucide-react';
import { getProactiveGreeting } from '../../services/ai/ProactiveService';

interface ProactiveGreetingProps {
  onStartChat?: () => void;
}

export default function ProactiveGreeting({ onStartChat }: ProactiveGreetingProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;

    const checkGreeting = async () => {
      try {
        const greeting = await getProactiveGreeting();
        if (cancelled || !greeting) return;

        setMessage(greeting);
        // Small delay before showing
        const timer = setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 1000);
        timersRef.current.push(timer);
      } catch (err) {
        console.error('[ProactiveGreeting] Error checking greeting:', err);
      }
    };

    checkGreeting();

    return () => {
      cancelled = true;
      // Clear all pending timers
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  if (!message || !visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    const timer = setTimeout(() => setMessage(null), 300);
    timersRef.current.push(timer);
  };

  const handleChat = () => {
    handleDismiss();
    onStartChat?.();
  };

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 max-w-sm transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="glass-card glass-glow rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">知己 AI</p>
            <p className="text-white/70 text-xs">关心你的每一天</p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <div className="px-4 py-3">
          <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={handleChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            聊聊
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            稍后
          </button>
        </div>
      </div>
    </div>
  );
}
