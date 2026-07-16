import { useEffect, useRef } from 'react';
import ChatPanel from '../components/assistant/ChatPanel';
import { useAI } from '../hooks/useAI';
import { useUIStore } from '../stores/uiStore';

export default function AssistantPage() {
  const { initService } = useAI();
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const prevCollapsedRef = useRef<boolean | null>(null);

  useEffect(() => {
    initService();
  }, [initService]);

  // 进入 AI 助理主页面时自动收窄侧边栏（保留图标导航能力，不完全隐藏）
  useEffect(() => {
    prevCollapsedRef.current = useUIStore.getState().sidebarCollapsed;
    setSidebarCollapsed(true);
    // 离开页面时恢复用户之前的折叠状态
    return () => {
      if (prevCollapsedRef.current !== null) {
        setSidebarCollapsed(prevCollapsedRef.current);
      }
    };
  }, [setSidebarCollapsed]);

  return (
    <div className="h-full relative">
      <ChatPanel />
    </div>
  );
}