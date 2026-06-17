import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Brain, Wind, BookOpen, ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import ThoughtRecord from '../components/therapy/ThoughtRecord';
import BreathingExercise from '../components/therapy/BreathingExercise';
import MindfulnessSession from '../components/therapy/MindfulnessSession';
import { db } from '../db';
import type { TherapyRecord } from '../db/models';

type TherapyMode = 'menu' | 'thought_record' | 'breathing' | 'mindfulness' | 'history';

export default function TherapyPage() {
  const [mode, setMode] = useState<TherapyMode>('menu');
  const [selectedRecord, setSelectedRecord] = useState<TherapyRecord | null>(null);

  // Get therapy records
  const therapyRecords = useLiveQuery(async () => {
    return db.therapyRecords
      .orderBy('createdAt')
      .reverse()
      .limit(20)
      .toArray();
  }, []);

  if (mode === 'history' && selectedRecord) {
    const data = selectedRecord.data as any;
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => {
            setMode('menu');
            setSelectedRecord(null);
          }}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <div className="glass-card glass-glow rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
            <h2 className="text-white font-bold text-lg">CBT 思维记录</h2>
            <p className="text-white/80 text-sm mt-1">{selectedRecord.date}</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">情境</h3>
              <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">{data.situation}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">自动思维</h3>
              <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">{data.automaticThought}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">情绪</h3>
              <div className="flex flex-wrap gap-2">
                {data.emotions?.map((e: string) => (
                  <span key={e} className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full">{e}</span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">强度: {data.emotionIntensity}%</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">支持的证据</h3>
              <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">{data.evidenceFor}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">反对的证据</h3>
              <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">{data.evidenceAgainst}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">替代想法</h3>
              <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">{data.alternativeThought}</p>
            </div>
            {data.newEmotionIntensity < data.emotionIntensity && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  情绪强度从 {data.emotionIntensity}% 降低到 {data.newEmotionIntensity}%，
                  降低了 {data.emotionIntensity - data.newEmotionIntensity}%！
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode !== 'menu') {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setMode('menu')}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        {mode === 'thought_record' && (
          <ThoughtRecord onComplete={() => setMode('menu')} />
        )}

        {mode === 'breathing' && (
          <BreathingExercise onComplete={() => setMode('menu')} />
        )}

        {mode === 'mindfulness' && (
          <MindfulnessSession onComplete={() => setMode('menu')} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">治疗练习</h1>
        <p className="text-sm text-slate-500 mt-1">基于认知行为疗法(CBT)的自助工具</p>
      </div>

      {/* Exercise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thought Record */}
        <button
          onClick={() => setMode('thought_record')}
          className="glass-card p-6 text-left glass-card-hover transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Brain className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">CBT 思维记录</h3>
          <p className="text-sm text-slate-600 mb-4">
            识别和挑战不合理的自动思维，通过证据评估找到更平衡的看法。
          </p>
          <div className="flex flex-wrap gap-2">
            {['识别思维扭曲', '证据评估', '认知重构'].map(tag => (
              <span key={tag} className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* Breathing Exercise */}
        <button
          onClick={() => setMode('breathing')}
          className="glass-card p-6 text-left glass-card-hover transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wind className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">呼吸练习</h3>
          <p className="text-sm text-slate-600 mb-4">
            通过有节奏的呼吸调节自主神经系统，帮助放松和缓解焦虑。
          </p>
          <div className="flex flex-wrap gap-2">
            {['4-7-8 呼吸', '方块呼吸', '腹式呼吸'].map(tag => (
              <span key={tag} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* Mindfulness */}
        <button
          onClick={() => setMode('mindfulness')}
          className="glass-card p-6 text-left glass-card-hover transition-shadow group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">正念冥想</h3>
          <p className="text-sm text-slate-600 mb-4">
            通过冥想练习培养对当下的觉察，减少反刍思维。
          </p>
          <div className="flex flex-wrap gap-2">
            {['身体扫描', '觉察呼吸', '慈悲冥想'].map(tag => (
              <span key={tag} className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* Guided Journal (placeholder) */}
        <div className="glass-card p-6 opacity-60">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">引导式日记</h3>
          <p className="text-sm text-slate-600 mb-4">
            通过结构化的写作引导，帮助你更好地理解和处理情绪。
          </p>
          <div className="flex flex-wrap gap-2">
            {['感恩日记', '成就日记', '情绪分析'].map(tag => (
              <span key={tag} className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">已集成到日记编辑器</p>
        </div>
      </div>

      {/* History */}
      {therapyRecords && therapyRecords.length > 0 && (
        <div className="glass-card rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            练习记录
          </h2>
          <div className="space-y-2">
            {therapyRecords.slice(0, 5).map((record) => {
              const data = record.data as any;
              const isThoughtRecord = record.type === 'thought_record';
              const isMindfulness = record.type === 'mindfulness';
              return (
                <button
                  key={record.id}
                  onClick={() => {
                    if (isThoughtRecord) {
                      setSelectedRecord(record);
                      setMode('history');
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    isThoughtRecord ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isThoughtRecord ? 'bg-indigo-100' : isMindfulness ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {isThoughtRecord ? (
                        <Brain className="w-4 h-4 text-indigo-600" />
                      ) : isMindfulness ? (
                        <BookOpen className="w-4 h-4 text-green-600" />
                      ) : (
                        <Wind className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {isThoughtRecord ? 'CBT 思维记录' : isMindfulness ? data.meditationName || '正念冥想' : '呼吸练习'}
                      </p>
                      <p className="text-xs text-slate-500">{record.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isThoughtRecord && data.emotionIntensity && data.newEmotionIntensity && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        data.newEmotionIntensity < data.emotionIntensity
                          ? 'bg-green-100 text-green-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {data.emotionIntensity}% → {data.newEmotionIntensity}%
                      </span>
                    )}
                    {isMindfulness && data.duration && (
                      <span className="text-xs text-slate-400">
                        {Math.floor(data.duration / 60)}分钟
                      </span>
                    )}
                    {isThoughtRecord && <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
        <h3 className="font-medium text-slate-800 mb-2">什么是认知行为疗法（CBT）？</h3>
        <p className="text-sm text-slate-600">
          CBT 是一种循证的心理治疗方法，核心理念是：我们的情绪和行为受到思维方式的影响。
          通过识别和改变不合理的思维模式，可以有效改善情绪问题。
          上述工具基于 CBT 的核心技术设计，可以帮助你更好地理解和管理自己的情绪。
        </p>
      </div>
    </div>
  );
}
