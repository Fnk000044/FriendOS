import { useEffect, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import QuickCaptureModal from './components/quick-capture/QuickCaptureModal';
import CrisisInterventionModal from './components/crisis/CrisisInterventionModal';
import ProactiveGreeting from './components/ai/ProactiveGreeting';
import WelcomePage from './pages/WelcomePage';
import LoadingPage from './components/common/LoadingPage';
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
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import DiaryPage from './pages/DiaryPage';
import DiaryEditor from './components/diary/DiaryEditor';
import HabitsPage from './pages/HabitsPage';
import MemoriesPage from './pages/MemoriesPage';
import EmotionPage from './pages/EmotionPage';
import TherapyPage from './pages/TherapyPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import SyncPage from './pages/SyncPage';
import AssistantPage from './pages/AssistantPage';
import AssessmentPage from './pages/AssessmentPage';
import RiskDashboardPage from './pages/RiskDashboardPage';

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
  const [showLoading, setShowLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const toggleAiAssistant = useUIStore((s) => s.toggleAiAssistant);
  const initAppLock = useAppLockStore((s) => s.initFromStorage);

  useIpcEvents();
  useSyncReceiver();

  // Initialize app lock on mount
  useEffect(() => {
    initAppLock();
  }, [initAppLock]);

  // Sync showWelcome with initialized state (handles reset)
  useEffect(() => {
    if (!initialized) {
      setShowWelcome(true);
    }
  }, [initialized]);

  // Check if onboarding should show (first time after welcome)
  useEffect(() => {
    if (initialized && !showWelcome && !showLoading) {
      const onboardingDone = localStorage.getItem('friendos_onboarding_done');
      if (!onboardingDone) {
        setShowOnboarding(true);
      }
    }
  }, [initialized, showWelcome, showLoading]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  if (showWelcome) {
    return (
      <ErrorBoundary>
        <TitleBar />
        <Toaster {...TOASTER_OPTIONS} />
        <WelcomePage onComplete={() => setShowWelcome(false)} />
      </ErrorBoundary>
    );
  }

  if (showLoading) {
    return (
      <ErrorBoundary>
        <TitleBar />
        <LoadingPage onComplete={handleLoadingComplete} />
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
            <Route path="risk" element={<PageErrorBoundary><RiskDashboardPage /></PageErrorBoundary>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
