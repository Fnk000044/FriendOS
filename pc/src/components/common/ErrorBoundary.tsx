import { Component, type ReactNode, type ErrorInfo } from 'react';
import { translations } from '../../i18n/translations';
import { useLanguage } from '../../i18n/useLanguage';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

const MAX_RETRIES = 3;

// 翻译辅助函数（用于类组件）
function getTranslation(key: string): string {
  const lang = useLanguage.getState?.()?.lang || 'zh-CN';
  const dict = translations[lang as keyof typeof translations] || translations['zh-CN'];
  return (dict as Record<string, string>)[key] || key;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    if (this.state.retryCount >= MAX_RETRIES) {
      return;
    }
    this.setState((prev) => ({
      hasError: false,
      error: undefined,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <p className="text-sm font-medium text-red-500">{getTranslation('error.title')}</p>
          <p className="text-xs mt-1">{this.state.error.message}</p>
          {this.state.retryCount < MAX_RETRIES ? (
            <button
              onClick={this.handleRetry}
              className="mt-4 px-4 py-2 text-sm bg-primary text-white rounded-btn hover:bg-primary-dark"
            >
              {getTranslation('error.retry')} ({MAX_RETRIES - this.state.retryCount})
            </button>
          ) : (
            <p className="mt-4 text-xs text-text-muted">
              {getTranslation('error.retry_failed')}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
