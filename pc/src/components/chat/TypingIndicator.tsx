interface Props {
  reduceMotion?: boolean;
}

/**
 * 等待首个 chunk 时的打字动画
 * reduceMotion 时只显示静态三点
 */
export default function TypingIndicator({ reduceMotion }: Props) {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--gradient-primary)' }}>
        <span className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />
      </div>
      <div className="rounded-2xl px-3.5 py-2.5 flex items-center gap-1" style={{ background: 'var(--bg-hover)', borderTopLeftRadius: '6px' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-text-muted"
            style={{
              animation: reduceMotion ? 'none' : `typing-bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
              opacity: reduceMotion ? 0.5 : undefined,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
