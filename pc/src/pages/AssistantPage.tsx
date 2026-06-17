import { useEffect } from 'react';
import ChatPanel from '../components/assistant/ChatPanel';
import { useAI } from '../hooks/useAI';

export default function AssistantPage() {
  const { initService } = useAI();

  useEffect(() => {
    initService();
  }, [initService]);

  return (
    <div className="h-full relative">
      <ChatPanel />
    </div>
  );
}