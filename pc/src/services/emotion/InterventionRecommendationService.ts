/**
 * Intervention Recommendation Service
 * 基于用户健康画像，智能推荐最适合的治疗练习
 *
 * 0.0.6 增强：加入"历史有效率"权重
 *   推荐分 = 规则基础分 × 0.6 + 历史有效率 × 0.4
 *   数据不足（< 3 次）时退回纯规则
 */

import type { HealthProfile } from '../../db/models';
<<<<<<< HEAD
import { computeInterventionEma } from '../selfevolution/SelfEvolutionService';
import type { InterventionType } from '../selfevolution/types';
=======
import { getBestIntervention } from '../therapy/EffectivenessService';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

export interface Recommendation {
  id: string;
  type: 'breathing' | 'mindfulness' | 'thoughtRecord' | 'activity';
  title: string;
  description: string;
  reason: string;
  priority: number;
  estimatedTime: string;
  route: string;
}

/**
 * 根据健康画像生成个性化干预推荐
 *
 * @param profile 健康画像
<<<<<<< HEAD
 * @param useEffectiveness 是否融合历史有效率 EMA（默认 true，<3 次有效样本退回纯规则）
=======
 * @param useEffectiveness 是否融合历史有效率权重（默认 true，<3 次记录退回纯规则）
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
 */
export async function getRecommendations(
  profile: HealthProfile | null,
  useEffectiveness = true
): Promise<Recommendation[]> {
  const baseRecs = getBaseRecommendations(profile);

  if (!useEffectiveness) return baseRecs;

<<<<<<< HEAD
  // 带遗忘因子的有效率 EMA（隐式 moodBefore/After + 显式反馈）
  const ema = await computeInterventionEma();
  // 冷启动：总有效样本 < 3 → 回退纯规则
  if (ema.sampleCount < 3) return baseRecs;

  // 规则基础分 × 0.6 + EMA 有效率 × 0.4
  const maxBase = Math.max(...baseRecs.map(r => r.priority), 1);
  return baseRecs.map(rec => {
    const type = recTypeToIntervention(rec.type);
    const effectivenessScore = type ? ema.emaEffectiveness[type] : 0.5;
=======
  // 融合历史有效率权重
  const best = await getBestIntervention();
  if (!best) return baseRecs; // 数据不足退回纯规则

  // 规则基础分 × 0.6 + 历史有效率 × 0.4
  const maxBase = Math.max(...baseRecs.map(r => r.priority), 1);
  return baseRecs.map(rec => {
    const isBestType = bestTypeMatch(rec.type, best.type);
    const effectivenessScore = isBestType ? best.effectivenessRate : (best.effectivenessRate * 0.5);
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    const weightedPriority = round2(
      (rec.priority / maxBase) * 6 + effectivenessScore * 4
    );
    return {
      ...rec,
      priority: weightedPriority,
<<<<<<< HEAD
      reason: type
        ? `${rec.reason}（近期有效率约 ${Math.round(effectivenessScore * 100)}%）`
=======
      reason: isBestType
        ? `${rec.reason}（你过去体验效果最好，有效率 ${Math.round(best.effectivenessRate * 100)}%）`
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
        : rec.reason,
    };
  }).sort((a, b) => b.priority - a.priority).slice(0, 4);
}

/**
<<<<<<< HEAD
 * 推荐类型与干预统计类型的映射
 */
function recTypeToIntervention(recType: Recommendation['type']): InterventionType | null {
  if (recType === 'breathing') return 'breathing';
  if (recType === 'mindfulness') return 'mindfulness';
  if (recType === 'thoughtRecord') return 'thought_record';
  return null;
=======
 * 推荐类型与统计类型的映射
 */
function bestTypeMatch(recType: Recommendation['type'], statType: string): boolean {
  if (recType === 'breathing' && statType === 'breathing') return true;
  if (recType === 'mindfulness' && statType === 'mindfulness') return true;
  if (recType === 'thoughtRecord' && statType === 'thought_record') return true;
  return false;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 纯规则推荐（原 getRecommendations 逻辑）
 */
function getBaseRecommendations(profile: HealthProfile | null): Recommendation[] {
  if (!profile) return getDefaultRecommendations();

  const recs: Recommendation[] = [];
  const { dimensions } = profile;

  // 高压力 → 呼吸练习
  if (dimensions.stress > 70) {
    recs.push({
      id: 'breathing-478',
      type: 'breathing',
      title: '4-7-8 呼吸练习',
      description: '通过控制呼吸节奏激活副交感神经，快速缓解焦虑',
      reason: `压力指数 ${dimensions.stress}/100，呼吸练习可快速降低皮质醇`,
      priority: dimensions.stress > 85 ? 10 : 7,
      estimatedTime: '5 分钟',
      route: '/therapy?exercise=breathing',
    });
  }

  // 低情绪 + 高压力 → 正念冥想
  if (dimensions.mood < 40 || dimensions.stress > 60) {
    recs.push({
      id: 'mindfulness-body-scan',
      type: 'mindfulness',
      title: '正念身体扫描',
      description: '通过关注身体感受，从焦虑思维中抽离',
      reason: dimensions.mood < 40
        ? `情绪偏低（${dimensions.mood}/100），正念练习帮助回到当下`
        : `压力较大时，身体扫描能放松紧张的肌肉`,
      priority: dimensions.mood < 30 ? 9 : 6,
      estimatedTime: '10 分钟',
      route: '/therapy?exercise=mindfulness',
    });
  }

  // 低精力 → 活动建议
  if (dimensions.energy < 40) {
    recs.push({
      id: 'walk',
      type: 'activity',
      title: '散步 15 分钟',
      description: '轻度运动提升血清素和多巴胺水平',
      reason: `精力指数较低（${dimensions.energy}/100），短时间散步比躺着更能恢复精力`,
      priority: 5,
      estimatedTime: '15 分钟',
      route: '/therapy',
    });
  }

  // 低社交 → 社交活动建议
  if (dimensions.social < 40) {
    recs.push({
      id: 'social-reach',
      type: 'activity',
      title: '联系一位朋友',
      description: '给朋友发条消息或打个电话，哪怕只是闲聊',
      reason: `社交指数偏低（${dimensions.social}/100），人际连接是心理健康的重要保护因素`,
      priority: 4,
      estimatedTime: '10 分钟',
      route: '/therapy',
    });
  }

  // 低睡眠 → 睡眠建议
  if (dimensions.sleep < 40) {
    recs.push({
      id: 'sleep-hygiene',
      type: 'mindfulness',
      title: '睡前放松仪式',
      description: '放下手机，做 5 分钟呼吸练习，帮助入睡',
      reason: `睡眠质量较低（${dimensions.sleep}/100），建立睡前仪式可改善`,
      priority: 6,
      estimatedTime: '10 分钟',
      route: '/therapy?exercise=breathing',
    });
  }

  // 默认推荐 CBT 思维记录
  recs.push({
    id: 'thought-record',
    type: 'thoughtRecord',
    title: 'CBT 思维记录',
    description: '识别并挑战负面自动思维，建立更平衡的认知',
    reason: '定期做思维记录可帮助识别思维模式',
    priority: 3,
    estimatedTime: '15 分钟',
    route: '/therapy?exercise=thought_record',
  });

  return recs.sort((a, b) => b.priority - a.priority);
}

/**
 * 无画像时的默认推荐
 */
function getDefaultRecommendations(): Recommendation[] {
  return [
    {
      id: 'breathing-default',
      type: 'breathing',
      title: '4-7-8 呼吸练习',
      description: '通过控制呼吸节奏激活副交感神经',
      reason: '每天练习有助于保持情绪稳定',
      priority: 5,
      estimatedTime: '5 分钟',
      route: '/therapy?exercise=breathing',
    },
    {
      id: 'thought-record-default',
      type: 'thoughtRecord',
      title: 'CBT 思维记录',
      description: '识别并挑战负面自动思维',
      reason: '帮助建立更平衡的认知模式',
      priority: 4,
      estimatedTime: '15 分钟',
      route: '/therapy?exercise=thought_record',
    },
    {
      id: 'mindfulness-default',
      type: 'mindfulness',
      title: '正念冥想',
      description: '通过关注当下，减少焦虑和压力',
      reason: '正念练习有助于情绪调节',
      priority: 3,
      estimatedTime: '10 分钟',
      route: '/therapy?exercise=mindfulness',
    },
  ];
}
