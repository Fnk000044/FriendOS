import { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = window.electronAPI?.platform === 'darwin';

  useEffect(() => {
    window.electronAPI?.isMaximized().then(setIsMaximized);
    const cleanup = window.electronAPI?.onMaximizeChange((maximized: boolean) => {
      setIsMaximized(maximized);
    }) as unknown as (() => void) | undefined;
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => window.electronAPI?.maximizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();

  if (isMac) {
    return (
      <div
        className="h-8 border-b flex items-center px-3 fixed top-0 left-0 right-0 z-50 select-none backdrop-blur-sm"
        style={{ WebkitAppRegion: 'drag', background: 'var(--bg-card)' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button aria-label="关闭" onClick={handleClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors" />
          <button aria-label="最小化" onClick={handleMinimize} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
          <button aria-label="最大化" onClick={handleMaximize} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-8 border-b flex items-center justify-between fixed top-0 left-0 right-0 z-50 select-none backdrop-blur-sm"
      style={{ WebkitAppRegion: 'drag', background: 'var(--bg-card)' } as React.CSSProperties}
    >
      <div className="flex items-center px-3 text-sm text-text-muted">
        FriendOS
      </div>
      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-surface-hover transition-colors flex items-center justify-center"
          title="最小化"
        >
          <Minus className="w-4 h-4 text-text-secondary" strokeWidth={2} />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-surface-hover transition-colors flex items-center justify-center"
          title={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-secondary">
              <rect x="2.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M4.5 4.5V2.5C4.5 2.5 4.5 2.5 4.5 2.5H11.5C11.5 2.5 11.5 2.5 11.5 2.5V9.5C11.5 9.5 11.5 9.5 11.5 9.5H9.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          ) : (
            <Square className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" strokeWidth={1.5} />
          )}
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500 transition-colors flex items-center justify-center group"
          title="关闭"
        >
          <X className="w-4 h-4 text-text-secondary group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}