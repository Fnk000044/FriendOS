import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import QuickCaptureModal from './components/quick-capture/QuickCaptureModal';
import CrisisInterventionModal from './components/crisis/CrisisInterventionModal';
import WelcomePage from './pages/WelcomePage';
import LoadingPage from './components/common/LoadingPage';
import LoadingSpinner from './components/common/LoadingSpinner';
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
// 首屏 Dashboard 保持 eager 加载，其余路由懒加载以减小首屏体积
import DashboardPage from './pages/DashboardPage';
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
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const RiskDashboardPage = lazy(() => import('./pages/RiskDashboardPage'));

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
    const handler = async (e: KeyboardEvent) => {
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
          } else if (action === 'exportData') {
            // 直接调主进程 IPC 弹出导出对话框（不依赖 SettingsPage 挂载）
            try {
              await window.electronAPI?.backupExport('');
            } catch (err) {
              console.error('[GlobalShortcuts] export failed:', err);
            }
          } else if (action === 'importData') {
            // 导入数据：主进程读文件返回 JSON，再 dispatch onImportData 事件让 App 处理
            try {
              const result = await window.electronAPI?.backupImport();
              if (result?.success && result.data) {
                // 复用现有 onImportData IPC 事件链路（main.cjs 会 dispatch）
                window.dispatchEvent(new CustomEvent('friendos-import', { detail: result.data }));
              }
            } catch (err) {
              console.error('[GlobalShortcuts] import failed:', err);
            }
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
            <Route path="tasks" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><TasksPage /></Suspense></PageErrorBoundary>} />
            <Route path="diary" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><DiaryPage /></Suspense></PageErrorBoundary>} />
            <Route path="diary/new" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><DiaryEditor /></Suspense></PageErrorBoundary>} />
            <Route path="diary/:id" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><DiaryEditor /></Suspense></PageErrorBoundary>} />
            <Route path="habits" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><HabitsPage /></Suspense></PageErrorBoundary>} />
            <Route path="memories" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><MemoriesPage /></Suspense></PageErrorBoundary>} />
            <Route path="emotion" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><EmotionPage /></Suspense></PageErrorBoundary>} />
            <Route path="therapy" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><TherapyPage /></Suspense></PageErrorBoundary>} />
            <Route path="reports" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><ReportsPage /></Suspense></PageErrorBoundary>} />
            <Route path="settings" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><SettingsPage /></Suspense></PageErrorBoundary>} />
            <Route path="sync" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><SyncPage /></Suspense></PageErrorBoundary>} />
            <Route path="assessment" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><AssessmentPage /></Suspense></PageErrorBoundary>} />
            <Route path="risk" element={<PageErrorBoundary><Suspense fallback={<LoadingSpinner />}><RiskDashboardPage /></Suspense></PageErrorBoundary>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
