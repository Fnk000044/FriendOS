import { useState, useCallback, useRef } from 'react';
import { computeSentimentCalibration } from '../services/selfevolution/SelfEvolutionService';

export interface SentimentResult {
  level: 'low' | 'medium' | 'high' | 'crisis';
  score: number;
  positiveProb: number;
  negativeProb: number;
  crisisProb?: number;
  keywords: string[];
  needCloud: boolean;
  timestamp: number;
  error?: string;
}

export interface CloudAnalysisResult {
  crisisLevel: 'low' | 'medium' | 'high';
  analysis: string;
  suggestions: string[];
  timestamp: number;
  error?: string;
}

interface UseSentimentReturn {
  analyze: (text: string) => Promise<SentimentResult | null>;
  analyzeWithCloud: (text: string, context?: { date?: string; mood?: number; tags?: string[] }) => Promise<{ local: SentimentResult | null; cloud: CloudAnalysisResult | null }>;
  configureApiKey: (apiKey: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useSentiment(): UseSentimentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callIdRef = useRef(0);

  const analyze = useCallback(async (text: string): Promise<SentimentResult | null> => {
    if (!text.trim()) return null;

    const api = window.electronAPI;
    if (!api?.sentimentAnalyze) {
      setError('Sentiment API not available');
      return null;
    }

    const myCall = ++callIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const calibration = await computeSentimentCalibration();
      const result = await api.sentimentAnalyze(text, calibration);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      return null;
    } finally {
      // 只有最新一次调用才清除 loading
      if (callIdRef.current === myCall) setLoading(false);
    }
  }, []);

  const analyzeWithCloud = useCallback(
    async (
      text: string,
      context?: { date?: string; mood?: number; tags?: string[] }
    ): Promise<{ local: SentimentResult | null; cloud: CloudAnalysisResult | null }> => {
      if (!text.trim()) {
        return { local: null, cloud: null };
      }

      const api = window.electronAPI;
      if (!api?.sentimentAnalyze || !api?.sentimentCloudAnalyze) {
        setError('Sentiment API not available');
        return { local: null, cloud: null };
      }

      const myCall = ++callIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const calibration = await computeSentimentCalibration();
        const local = await api.sentimentAnalyze(text, calibration);
        let cloud: CloudAnalysisResult | null = null;

        if (local?.needCloud) {
          cloud = await api.sentimentCloudAnalyze(text, context);
        }

        return { local, cloud };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        return { local: null, cloud: null };
      } finally {
        if (callIdRef.current === myCall) setLoading(false);
      }
    },
    []
  );

  const configureApiKey = useCallback(async (apiKey: string): Promise<void> => {
    const api = window.electronAPI;
    if (!api?.sentimentSetApiKey) {
      setError('Sentiment API not available');
      return;
    }
    try {
      await api.sentimentSetApiKey(apiKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to configure API key';
      setError(message);
    }
  }, []);

  return { analyze, analyzeWithCloud, configureApiKey, loading, error };
}