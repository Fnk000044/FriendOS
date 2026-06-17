/**
 * Intervention Recommendation Service
 * 基于用户健康画像，智能推荐最适合的治疗练习
 */

import type { HealthProfile } from '../../db/models';

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
 */
export function getRecommendations(profile: HealthProfile | null): Recommendation[] {
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

  return recs.sort((a, b) => b.priority - a.priority).slice(0, 4);
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
