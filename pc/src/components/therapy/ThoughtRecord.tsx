import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Save } from 'lucide-react';
import { db } from '../../db';
import { getToday } from '../../utils/date';

interface ThoughtRecordData {
  situation: string;
  automaticThought: string;
  emotions: string[];
  emotionIntensity: number;
  evidenceFor: string;
  evidenceAgainst: string;
  alternativeThought: string;
  newEmotionIntensity: number;
  alternativeBelief: number; // 替代思维信念度（0-100%）
  behaviorExperiment: string; // 行为实验计划
  followUpEmotion: number; // 后续情绪评分
}

// CBT思维记录完整流程（7步）
// 参考：标准CBT思维记录协议
const STEPS = [
  { title: '情境', description: '发生了什么？' },
  { title: '自动思维', description: '脑海中浮现了什么想法？' },
  { title: '情绪', description: '感受如何？' },
  { title: '证据评估', description: '支持和反对这个想法的证据' },
  { title: '替代想法', description: '更平衡的看法是什么？' },
  { title: '信念度评估', description: '你对替代想法的相信程度' },
  { title: '行动计划', description: '如何验证新的想法？' },
];

const EMOTION_OPTIONS = [
  { label: '焦虑', icon: '😰' },
  { label: '悲伤', icon: '😢' },
  { label: '愤怒', icon: '😠' },
  { label: '恐惧', icon: '😨' },
  { label: '羞耻', icon: '😳' },
  { label: '内疚', icon: '😣' },
  { label: '孤独', icon: '😔' },
  { label: '绝望', icon: '😞' },
  { label: '烦躁', icon: '😤' },
  { label: '困惑', icon: '🤔' },
];

// CBT认知扭曲列表（扩展到15种）
// 参考：Burns, 1980, Feeling Good
const DISTORTIONS = [
  '灾难化：把事情想到最坏',
  '非黑即白：只有好和坏两个极端',
  '过度概括：一次失败就觉得永远失败',
  '读心术：假设别人怎么想',
  '应该思维：我应该/必须...',
  '情绪推理：我觉得...所以是真的',
  '选择性关注：只看负面',
  '贴标签：我是个失败者',
  '否定正面：把好事解释成例外',
  '放大缩小：放大缺点，缩小优点',
  '个人化：都是我的错',
  '指责：都是别人的错',
  '不公平比较：拿自己的弱点比别人的优点',
  '后悔倾向：要是...就好了',
  '悲观预测：未来一定会更糟',
];

interface ThoughtRecordProps {
  onComplete?: () => void;
}

export default function ThoughtRecord({ onComplete }: ThoughtRecordProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState<ThoughtRecordData>({
    situation: '',
    automaticThought: '',
    emotions: [],
    emotionIntensity: 50,
    evidenceFor: '',
    evidenceAgainst: '',
    alternativeThought: '',
    newEmotionIntensity: 30,
    alternativeBelief: 50,
    behaviorExperiment: '',
    followUpEmotion: 30,
  });
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);

  const updateData = (field: keyof ThoughtRecordData, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEmotion = (emotion: string) => {
    setData(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...prev.emotions, emotion],
    }));
  };

  const toggleDistortion = (distortion: string) => {
    setSelectedDistortions(prev =>
      prev.includes(distortion)
        ? prev.filter(d => d !== distortion)
        : [...prev, distortion]
    );
  };

  const goToStep = (step: number) => {
    // 使用CSS transition而非setTimeout
    // 设置淡出状态
    setFadeClass('opacity-0 translate-x-2');

    // 使用requestAnimationFrame等待transition完成
    requestAnimationFrame(() => {
      setTimeout(() => {
        setCurrentStep(step);
        setFadeClass('opacity-100 translate-x-0');
      }, 200); // 匹配CSS transition duration
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.situation.trim().length > 0;
      case 1: return data.automaticThought.trim().length > 0;
      case 2: return data.emotions.length > 0;
      case 3: return data.evidenceFor.trim().length > 0 || data.evidenceAgainst.trim().length > 0;
      case 4: return data.alternativeThought.trim().length > 0;
      case 5: return true; // 信念度总是有值
      case 6: return true; // 行为实验可选
      default: return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.therapyRecords.add({
        id: crypto.randomUUID(),
        type: 'thought_record',
        date: getToday(),
        data: {
          ...data,
          distortions: selectedDistortions,
        },
        moodBefore: data.emotionIntensity,
        moodAfter: data.newEmotionIntensity,
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save thought record:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              描述一个让你感到困扰的具体情境。尽量客观地描述事实，而不是你的想法。
            </p>
            <textarea
              value={data.situation}
              onChange={(e) => updateData('situation', e.target.value)}
              placeholder="例如：今天开会时，领导批评了我的方案..."
              className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              当时你脑海中自动浮现了什么想法？这些想法往往是瞬间的、自动的。
            </p>
            <textarea
              value={data.automaticThought}
              onChange={(e) => updateData('automaticThought', e.target.value)}
              placeholder="例如：我真是太没用了，什么都做不好..."
              className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div>
              <p className="text-xs text-slate-500 mb-2">可能存在思维扭曲：</p>
              <div className="flex flex-wrap gap-2">
                {DISTORTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => toggleDistortion(d)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedDistortions.includes(d)
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'text-slate-500'
                    }`}
                    style={selectedDistortions.includes(d) ? undefined : { borderColor: 'var(--glass-border)' }}
                  >
                    {d.split('：')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              选择你当时感受到的情绪（可多选），并调节情绪强度。
            </p>
            <div className="flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => toggleEmotion(label)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors ${
                    data.emotions.includes(label)
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  style={data.emotions.includes(label) ? undefined : { borderColor: 'var(--glass-border)' }}
                >
                  <span>{icon}</span>
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">情绪强度</span>
                <span className="text-sm font-medium text-indigo-600">{data.emotionIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.emotionIntensity}
                onChange={(e) => updateData('emotionIntensity', parseInt(e.target.value))}
                aria-label="情绪强度"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>轻微</span>
                <span>强烈</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              客观地分析：有哪些证据支持这个想法？有哪些证据反对它？
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">支持的证据</label>
              <textarea
                value={data.evidenceFor}
                onChange={(e) => updateData('evidenceFor', e.target.value)}
                placeholder="有哪些事实支持这个想法？"
                className="w-full h-24 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">反对的证据</label>
              <textarea
                value={data.evidenceAgainst}
                onChange={(e) => updateData('evidenceAgainst', e.target.value)}
                placeholder="有哪些事实不支持这个想法？"
                className="w-full h-24 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              基于以上分析，一个更平衡、更客观的看法是什么？
            </p>
            <textarea
              value={data.alternativeThought}
              onChange={(e) => updateData('alternativeThought', e.target.value)}
              placeholder="例如：虽然这次方案被批评了，但这不代表我能力不行，我可以从中学习改进..."
              className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">现在的情绪强度</span>
                <span className="text-sm font-medium text-indigo-600">{data.newEmotionIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.newEmotionIntensity}
                onChange={(e) => updateData('newEmotionIntensity', parseInt(e.target.value))}
                aria-label="现在的情绪强度"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>轻微</span>
                <span>强烈</span>
              </div>
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
        );

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              你对这个替代想法的相信程度有多少？（0-100%）
            </p>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">信念度</span>
                <span className="text-sm font-medium text-indigo-600">{data.alternativeBelief}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.alternativeBelief}
                onChange={(e) => updateData('alternativeBelief', parseInt(e.target.value))}
                aria-label="替代思维信念度"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>完全不信</span>
                <span>完全相信</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                💡 信念度可以帮助你追踪对替代想法的接受程度。随着时间推移，这个数字可能会上升。
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              你可以做些什么来验证这个新的想法？制定一个具体的行为实验计划。
            </p>
            <textarea
              value={data.behaviorExperiment}
              onChange={(e) => updateData('behaviorExperiment', e.target.value)}
              placeholder="例如：下次方案被批评时，我会主动询问具体改进点，而不是直接否定自己..."
              className="w-full h-32 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">后续情绪评分（可稍后填写）</span>
                <span className="text-sm font-medium text-indigo-600">{data.followUpEmotion}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.followUpEmotion}
                onChange={(e) => updateData('followUpEmotion', parseInt(e.target.value))}
                aria-label="后续情绪评分"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>轻微</span>
                <span>强烈</span>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                💡 行为实验是CBT的重要组成部分。通过实际行动来检验你的想法，可以帮助你建立更健康的思维模式。
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (saved) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="glass-card glass-glow rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
            <h2 className="text-white font-bold text-lg">CBT 思维记录</h2>
            <p className="text-white/80 text-sm mt-1">记录已保存</p>
          </div>
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">保存成功！</h3>
            <p className="text-sm text-slate-600 mb-4">
              情绪强度从 {data.emotionIntensity}% 变为 {data.newEmotionIntensity}%
              {data.newEmotionIntensity < data.emotionIntensity && (
                <span className="text-green-600">，降低了 {data.emotionIntensity - data.newEmotionIntensity}%</span>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSaved(false);
                  setCurrentStep(0);
                  setData({
                    situation: '',
                    automaticThought: '',
                    emotions: [],
                    emotionIntensity: 50,
                    evidenceFor: '',
                    evidenceAgainst: '',
                    alternativeThought: '',
                    newEmotionIntensity: 30,
                    alternativeBelief: 50,
                    behaviorExperiment: '',
                    followUpEmotion: 30,
                  });
                  setSelectedDistortions([]);
                }}
                className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                再写一篇
              </button>
              <button
                onClick={onComplete}
                className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="glass-card glass-glow rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
          <h2 className="text-white font-bold text-lg">CBT 思维记录</h2>
          <p className="text-white/80 text-sm mt-1">识别和挑战不合理的自动思维</p>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i < currentStep ? 'bg-indigo-500 text-white' :
                  i === currentStep ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    i < currentStep ? 'bg-indigo-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mb-4">
            <h3 className="font-medium text-slate-800">{STEPS[currentStep].title}</h3>
            <p className="text-xs text-slate-500">{STEPS[currentStep].description}</p>
          </div>
        </div>

        {/* Content */}
        <div className={`px-6 pb-4 transition-all duration-200 ease-in-out ${fadeClass}`}>
          {renderStep()}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t flex justify-between" style={{ background: 'var(--bg-hover)', borderColor: 'var(--glass-border)' }}>
          <button
            onClick={() => goToStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => goToStep(currentStep + 1)}
              disabled={!canProceed()}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                canProceed()
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              下一步
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canProceed() || saving}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                canProceed() && !saving
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存记录'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
