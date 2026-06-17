import { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import QuickCaptureModal from './components/quick-capture/QuickCaptureModal';
import CrisisInterventionModal from './components/crisis/CrisisInterventionModal';
import ProactiveGreeting from './components/ai/ProactiveGreeting';
import WelcomePage from './pages/WelcomePage';
import { useUIStore } from './stores/uiStore';
import { useShortcutStore } from './stores/useShortcutStore';
import { parseShortcut } from './utils/shortcutConflict';
import { useLanguage } from './i18n/useLanguage';
import { useIpcEvents } from './hooks/useIpcEvents';
import { useSyncReceiver } from './hooks/useSyncReceiver';
import ErrorBoundary from './components/common/ErrorBoundary';
import TitleBar from './components/layout/TitleBar';
import LockScreen from './components/common/LockScreen';
import OnboardingTour from './components/common/OnboardingTour';
import { useAppLockStore } from './stores/appLockStore';

// Lazy-loaded pages (code splitting - reduces initial bundle)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const DiaryPage = lazy(() => import('./pages/DiaryPage'));
const DiaryEditor = lazy(() => import('./components/diary/DiaryEditor'));
const HabitsPage = lazy(() => import('./pages/HabitsPage'));
const MemoriesPage = lazy(() => import('./pages/MemoriesPage'));
const EmotionPage = lazy(() => import('./pages/EmotionPage'));
const TherapyPage = lazy(() => import('./pages/TherapyPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SyncPage = lazy(() => import('./pages/SyncPage'));
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));

// 预加载常用页面（减少首次切换闪烁）
function preloadRoutes() {
  const routes = [
    () => import('./pages/TasksPage'),
    () => import('./pages/DiaryPage'),
    () => import('./pages/HabitsPage'),
    () => import('./pages/EmotionPage'),
    () => import('./pages/MemoriesPage'),
  ];
  // 空闲时预加载
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      routes.forEach(r => r().catch(() => {}));
    });
  } else {
    setTimeout(() => {
      routes.forEach(r => r().catch(() => {}));
    }, 2000);
  }
}

// Loading fallback for lazy pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-text-muted">加载中...</span>
      </div>
    </div>
  );
}

function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

const TOASTER_OPTIONS = {
  position: 'top-center' as const,
  toastOptions: {
    duration: 3000,
    style: {
      background: '#fff',
      color: '#1E293B',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontSize: '14px',
    },
  },
};

function GlobalShortcuts() {
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);
  const shortcuts = useShortcutStore((s) => s.shortcuts);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const [action, shortcut] of Object.entries(shortcuts)) {
        const parsed = parseShortcut(shortcut);
        const ctrl = parsed.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shift = parsed.shift ? e.shiftKey : !e.shiftKey;
        const alt = parsed.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === parsed.key.toLowerCase();

        if (ctrl && shift && alt && keyMatch) {
          e.preventDefault();
          if (action === 'quickCapture') {
            openQuickCapture();
          }
          break;
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts, openQuickCapture]);

  return null;
}

export default function App() {
  const initialized = useLanguage((s) => s.initialized);
  const [showWelcome, setShowWelcome] = useState(!initialized);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const toggleAiAssistant = useUIStore((s) => s.toggleAiAssistant);
  const initAppLock = useAppLockStore((s) => s.initFromStorage);

  useIpcEvents();
  useSyncReceiver();

  // Initialize app lock on mount
  useEffect(() => {
    initAppLock();
    preloadRoutes();
  }, [initAppLock]);

  // Check if onboarding should show (first time after welcome)
  useEffect(() => {
    if (initialized && !showWelcome) {
      const onboardingDone = localStorage.getItem('friendos_onboarding_done');
      if (!onboardingDone) {
        setShowOnboarding(true);
      }
    }
  }, [initialized, showWelcome]);

  if (showWelcome) {
    return (
      <ErrorBoundary>
        <TitleBar />
        <Toaster {...TOASTER_OPTIONS} />
        <WelcomePage onComplete={() => setShowWelcome(false)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <LockScreen />
        <TitleBar />
        <GlobalShortcuts />
        <QuickCaptureModal />
        <CrisisInterventionModal />
        <ProactiveGreeting onStartChat={toggleAiAssistant} />
        {showOnboarding && (
          <OnboardingTour onComplete={() => {
            localStorage.setItem('friendos_onboarding_done', 'true');
            setShowOnboarding(false);
          }} />
        )}
        <Toaster {...TOASTER_OPTIONS} />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<PageErrorBoundary><DashboardPage /></PageErrorBoundary>} />
              <Route path="tasks" element={<PageErrorBoundary><TasksPage /></PageErrorBoundary>} />
              <Route path="diary" element={<PageErrorBoundary><DiaryPage /></PageErrorBoundary>} />
              <Route path="diary/new" element={<PageErrorBoundary><DiaryEditor /></PageErrorBoundary>} />
              <Route path="diary/:id" element={<PageErrorBoundary><DiaryEditor /></PageErrorBoundary>} />
              <Route path="habits" element={<PageErrorBoundary><HabitsPage /></PageErrorBoundary>} />
              <Route path="memories" element={<PageErrorBoundary><MemoriesPage /></PageErrorBoundary>} />
              <Route path="emotion" element={<PageErrorBoundary><EmotionPage /></PageErrorBoundary>} />
              <Route path="therapy" element={<PageErrorBoundary><TherapyPage /></PageErrorBoundary>} />
              <Route path="reports" element={<PageErrorBoundary><ReportsPage /></PageErrorBoundary>} />
              <Route path="settings" element={<PageErrorBoundary><SettingsPage /></PageErrorBoundary>} />
              <Route path="sync" element={<PageErrorBoundary><SyncPage /></PageErrorBoundary>} />
              <Route path="assistant" element={<PageErrorBoundary><AssistantPage /></PageErrorBoundary>} />
              <Route path="assessment" element={<PageErrorBoundary><AssessmentPage /></PageErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  );
}
