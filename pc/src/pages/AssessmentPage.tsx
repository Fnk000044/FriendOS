import { useState, useMemo } from 'react';
import { ClipboardList, ArrowLeft, History, Trash2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import PHQ9Form from '../components/assessment/PHQ9Form';
import GAD7Form from '../components/assessment/GAD7Form';
import PSS10Form from '../components/assessment/PSS10Form';
import CSSRSForm from '../components/assessment/CSSRSForm';
import AssessmentResult from '../components/assessment/AssessmentResult';
import { useAssessments } from '../hooks/useAssessments';
import { useLanguage } from '../i18n/useLanguage';
import { useCrisisStore } from '../stores/crisisStore';
import type { Assessment } from '../db/models';
import { getToday } from '../utils/date';

type View = 'home' | 'phq9' | 'gad7' | 'pss10' | 'cssrs' | 'result' | 'history';

export default function AssessmentPage() {
  const { t } = useLanguage();
  const { assessments, saveAssessment, deleteAssessment } = useAssessments();
  const { show: showCrisis } = useCrisisStore();
  const [view, setView] = useState<View>('home');
  const [currentType, setCurrentType] = useState<'PHQ9' | 'GAD7' | 'PSS10' | 'CSSRS'>('PHQ9');
  const [lastResult, setLastResult] = useState<Assessment | null>(null);

  const handleComplete = async (type: 'PHQ9' | 'GAD7' | 'PSS10' | 'CSSRS', scores: number[]) => {
    // 验证分数范围
    const expectedLength = type === 'PHQ9' ? 9 : type === 'GAD7' ? 7 : type === 'PSS10' ? 10 : 6;
    if (!Array.isArray(scores) || scores.length !== expectedLength) {
      console.error(`Invalid scores length: expected ${expectedLength}, got ${scores.length}`);
      return;
    }
    const maxScore = type === 'PSS10' ? 4 : type === 'CSSRS' ? 4 : 3;
    if (scores.some(s => typeof s !== 'number' || s < 0 || s > maxScore || !Number.isInteger(s))) {
      console.error(`Invalid score values: must be integers 0-${maxScore}`);
      return;
    }

    const totalScore = scores.reduce((a, b) => a + b, 0);

    // PHQ-9 第9题（自杀意念）≥1分 → 立即触发危机干预
    if (type === 'PHQ9' && scores[8] >= 1) {
      showCrisis('high', 'diary', `PHQ-9评估第9题得分：${scores[8]}分（自杀意念筛查阳性）`);
    }

    // C-SSRS: 任一自杀意念/行为阳性 → 触发危机干预
    if (type === 'CSSRS') {
      // Q1-Q5 任一为"是"（1+）即阳性；Q3/Q4/Q5（伴意图/计划/行为）为高危
      const hasIdeation = scores.slice(0, 5).some(s => s >= 1);
      const hasHighRisk = scores.slice(2, 5).some(s => s >= 1);
      if (hasHighRisk) {
        showCrisis('critical', 'diary', `C-SSRS 评估提示伴意图/计划/行为的自杀意念或自杀行为，需立即干预`);
      } else if (hasIdeation) {
        showCrisis('high', 'diary', `C-SSRS 评估提示存在自杀意念`);
      }
    }

    let level = '';
    if (type === 'PHQ9') {
      if (totalScore <= 4) level = 'minimal';
      else if (totalScore <= 9) level = 'mild';
      else if (totalScore <= 14) level = 'moderate';
      else if (totalScore <= 19) level = 'moderately_severe';
      else level = 'severe';
    } else if (type === 'GAD7') {
      if (totalScore <= 4) level = 'minimal';
      else if (totalScore <= 9) level = 'mild';
      else if (totalScore <= 14) level = 'moderate';
      else level = 'severe';
    } else if (type === 'PSS10') {
      // PSS-10: Cohen et al., 1983
      if (totalScore <= 13) level = 'low';
      else if (totalScore <= 26) level = 'moderate';
      else level = 'high';
    } else {
      // C-SSRS: 以最高危题号决定等级
      // Q3/Q4/Q5 任一阳性 → critical；Q1/Q2 阳性 → high；否则 low
      if (scores.slice(2, 5).some(s => s >= 1)) level = 'critical';
      else if (scores.slice(0, 2).some(s => s >= 1)) level = 'high';
      else level = 'low';
    }

    const assessment: Omit<Assessment, 'id' | 'createdAt'> = {
      type,
      date: getToday(),
      scores,
      totalScore,
      level,
      suggestions: '',
    };

    await saveAssessment(assessment);
    setLastResult({ ...assessment, id: '', createdAt: '' });
    setCurrentType(type);
    setView('result');
  };

  const phq9History = useMemo(() => assessments?.filter(a => a.type === 'PHQ9') ?? [], [assessments]);
  const gad7History = useMemo(() => assessments?.filter(a => a.type === 'GAD7') ?? [], [assessments]);
  const pss10History = useMemo(() => assessments?.filter(a => a.type === 'PSS10') ?? [], [assessments]);
  const cssrsHistory = useMemo(() => assessments?.filter(a => a.type === 'CSSRS') ?? [], [assessments]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        {view !== 'home' && (
          <button onClick={() => setView('home')} className="p-1 hover:bg-surface-hover rounded-lg cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {view === 'home' ? '心理评估' :
             view === 'phq9' ? 'PHQ-9 抑郁筛查' :
             view === 'gad7' ? 'GAD-7 焦虑筛查' :
             view === 'pss10' ? 'PSS-10 压力评估' :
             view === 'cssrs' ? 'C-SSRS 自杀风险筛查' :
             view === 'result' ? '评估结果' : '评估历史'}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {view === 'home' ? '基于专业量表的自我评估（可选功能）' : ''}
          </p>
        </div>
      </div>

      {/* Home view */}
      {view === 'home' && (
        <div className="space-y-4">
          <Card
            hover
            onClick={() => setView('phq9')}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">PHQ-9 抑郁筛查</h3>
              <p className="text-sm text-text-muted">9 个问题，评估抑郁症状严重程度</p>
            </div>
            {phq9History.length > 0 && (
              <span className="text-xs text-text-muted">
                上次：{phq9History[0].totalScore}分
              </span>
            )}
          </Card>

          <Card
            hover
            onClick={() => setView('gad7')}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">GAD-7 焦虑筛查</h3>
              <p className="text-sm text-text-muted">7 个问题，评估焦虑症状严重程度</p>
            </div>
            {gad7History.length > 0 && (
              <span className="text-xs text-text-muted">
                上次：{gad7History[0].totalScore}分
              </span>
            )}
          </Card>

          <Card
            hover
            onClick={() => setView('pss10')}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">PSS-10 压力评估</h3>
              <p className="text-sm text-text-muted">10 个问题，评估知觉压力水平</p>
            </div>
            {pss10History.length > 0 && (
              <span className="text-xs text-text-muted">
                上次：{pss10History[0].totalScore}分
              </span>
            )}
          </Card>

          <Card
            hover
            onClick={() => setView('cssrs')}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">C-SSRS 自杀风险筛查</h3>
              <p className="text-sm text-text-muted">6 个问题，Columbia 自杀严重程度评定量表（临床金标准）</p>
            </div>
            {cssrsHistory.length > 0 && (
              <span className="text-xs text-text-muted">
                上次：{cssrsHistory[0].level === 'critical' ? '危机' : cssrsHistory[0].level === 'high' ? '高风险' : '低风险'}
              </span>
            )}
          </Card>

          {(phq9History.length > 0 || gad7History.length > 0 || pss10History.length > 0 || cssrsHistory.length > 0) && (
            <Card hover onClick={() => setView('history')} className="flex items-center gap-3">
              <History className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-secondary">查看评估历史</span>
            </Card>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-700">
              💡 心理评估量表是可选功能，用于自我了解。系统会通过你的日常行为（写日记、聊天、完成任务等）无感知地分析心理状况，无需主动填写量表。
            </p>
          </div>
        </div>
      )}

      {/* PHQ-9 form */}
      {view === 'phq9' && (
        <Card>
          <PHQ9Form
            onComplete={(scores) => handleComplete('PHQ9', scores)}
            onCancel={() => setView('home')}
          />
        </Card>
      )}

      {/* GAD-7 form */}
      {view === 'gad7' && (
        <Card>
          <GAD7Form
            onComplete={(scores) => handleComplete('GAD7', scores)}
            onCancel={() => setView('home')}
          />
        </Card>
      )}

      {/* PSS-10 form */}
      {view === 'pss10' && (
        <Card>
          <PSS10Form
            onComplete={(scores) => handleComplete('PSS10', scores)}
            onCancel={() => setView('home')}
          />
        </Card>
      )}

      {/* C-SSRS form */}
      {view === 'cssrs' && (
        <Card>
          <CSSRSForm
            onComplete={(scores) => handleComplete('CSSRS', scores)}
            onCancel={() => setView('home')}
          />
        </Card>
      )}

      {/* Result */}
      {view === 'result' && lastResult && (
        <Card>
          <AssessmentResult
            type={currentType}
            scores={lastResult.scores}
            totalScore={lastResult.totalScore}
            level={lastResult.level}
            onClose={() => setView('home')}
            onRetake={() => setView(currentType === 'PHQ9' ? 'phq9' : currentType === 'GAD7' ? 'gad7' : currentType === 'PSS10' ? 'pss10' : 'cssrs')}
          />
        </Card>
      )}

      {/* History */}
      {view === 'history' && (
        <div className="space-y-4">
          {phq9History.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-text-primary">PHQ-9 评估记录</h3>
              {phq9History.map(a => (
                <Card key={a.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-muted">{a.date}</span>
                    <span className="ml-3 font-semibold">{a.totalScore} 分</span>
                    <span className="ml-2 text-sm text-text-secondary">
                      ({a.level === 'minimal' ? '无症状' : a.level === 'mild' ? '轻度' : a.level === 'moderate' ? '中度' : a.level === 'moderately_severe' ? '中重度' : '重度'})
                    </span>
                  </div>
                  <button
                    onClick={() => deleteAssessment(a.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}

          {gad7History.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-text-primary">GAD-7 评估记录</h3>
              {gad7History.map(a => (
                <Card key={a.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-muted">{a.date}</span>
                    <span className="ml-3 font-semibold">{a.totalScore} 分</span>
                    <span className="ml-2 text-sm text-text-secondary">
                      ({a.level === 'minimal' ? '无症状' : a.level === 'mild' ? '轻度' : a.level === 'moderate' ? '中度' : '重度'})
                    </span>
                  </div>
                  <button
                    onClick={() => deleteAssessment(a.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}

          {pss10History.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-text-primary">PSS-10 评估记录</h3>
              {pss10History.map(a => (
                <Card key={a.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-muted">{a.date}</span>
                    <span className="ml-3 font-semibold">{a.totalScore} 分</span>
                    <span className="ml-2 text-sm text-text-secondary">({a.level === 'low' ? '低压力' : a.level === 'moderate' ? '中等压力' : '高压力'})</span>
                  </div>
                  <button
                    onClick={() => deleteAssessment(a.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}

          {cssrsHistory.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-text-primary">C-SSRS 评估记录</h3>
              {cssrsHistory.map(a => (
                <Card key={a.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-text-muted">{a.date}</span>
                    <span className="ml-3 font-semibold">
                      {a.level === 'critical' ? '危机' : a.level === 'high' ? '高风险' : '低风险'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteAssessment(a.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}

          <Button variant="ghost" onClick={() => setView('home')}>返回</Button>
        </div>
      )}
    </div>
  );
}
