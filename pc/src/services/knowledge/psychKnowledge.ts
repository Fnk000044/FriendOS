/**
 * psychKnowledge.ts — 离线心理科普知识库（庆园杯 P1-5）
 *
 * 结构化心理科普内容，随应用内置、完全离线。
 * 内容为知识库数据（非 UI 文案），故 zh/en 双语内联存储；
 * 页面 UI 文案仍走 i18n（translations.ts）。
 *
 * 检索：searchKnowledge(query) 对标题/关键词/摘要做加权匹配。
 * 内容依据：APA 公众教育材料、NICE/中国心理学会科普口径，仅做心理教育用途。
 */

export interface KnowledgeSection {
  heading: { zh: string; en: string };
  paragraphs: Array<{ zh: string; en: string }>;
}

export interface KnowledgeTopic {
  id: string;
  title: { zh: string; en: string };
  category: 'study' | 'emotion' | 'sleep' | 'relationship' | 'self' | 'crisis' | 'daily';
  keywords: string[];
  summary: { zh: string; en: string };
  sections: KnowledgeSection[];
  tips: { zh: string[]; en: string[] };
  /** 高风险主题：卡片底部恒显热线提示 */
  hotline?: boolean;
}

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'exam-anxiety',
    title: { zh: '考前焦虑', en: 'Exam Anxiety' },
    category: 'study',
    keywords: ['考试', '期末', '焦虑', '复习', '挂科', '绩点', '考前', '紧张', '考砸'],
    summary: { zh: '适度的紧张能提升专注，过度的焦虑则会干扰发挥。考前焦虑完全可以管理。', en: 'Moderate arousal boosts focus; excessive anxiety hurts performance. Exam anxiety is very manageable.' },
    sections: [
      {
        heading: { zh: '考前焦虑是什么', en: 'What is exam anxiety' },
        paragraphs: [
          { zh: '考前焦虑表现为考前数天到数周的心慌、失眠、注意力涣散、反复担心"考不好怎么办"。它的核心是把考试结果灾难化——把一场考试等同于对自己整个人的评判。', en: 'Exam anxiety shows up days to weeks before a test as racing heart, insomnia, poor focus, and repeated "what if I fail" worries. At its core is catastrophizing — equating one exam with a verdict on your whole self.' },
          { zh: '心理学研究发现，适度的唤醒水平（紧张感）反而有利于发挥，这就是"耶克斯-多德森定律"。真正伤害发挥的是灾难化思维和逃避复习。', en: 'Research shows moderate arousal actually improves performance (the Yerkes-Dodson law). What really hurts is catastrophizing and avoidance.' },
        ],
      },
      {
        heading: { zh: '可以怎么做', en: 'What helps' },
        paragraphs: [
          { zh: '把复习拆成 25 分钟一个的小块（番茄工作法），完成比完美重要；用"我能控制什么"清单替代灾难化想象：我能控制复习节奏、作息、心态，不能控制题目难度和别人的水平。', en: 'Break revision into 25-minute blocks — completion beats perfection. Replace catastrophizing with a "what can I control" list: your pace, sleep and mindset are controllable; question difficulty and others\' scores are not.' },
          { zh: '考前一夜：按平时时间睡觉，避免通宵突击（睡眠剥夺会直接损害记忆提取）；进考场前做 2 分钟 4-7-8 呼吸，把注意力带回当下。', en: 'The night before: sleep at your usual time; all-nighters directly impair memory retrieval. Do 2 minutes of 4-7-8 breathing before entering the room to bring attention back to the present.' },
        ],
      },
    ],
    tips: {
      zh: ['把大目标拆成每天 3 个小任务，完成后打勾', '用「最坏情况→应对方案」写下担忧，把抽象恐惧变成具体计划', '考前 24 小时只做回顾，不学新内容', '一场考试只衡量一次表现，不衡量你这个人'],
      en: ['Break big goals into 3 small daily tasks and tick them off', 'Write down "worst case → my plan" to turn vague fear into a concrete plan', 'Review only, no new material, in the last 24 hours', 'One exam measures one performance, not you as a person'],
    },
  },
  {
    id: 'insomnia',
    title: { zh: '失眠与睡眠卫生', en: 'Insomnia & Sleep Hygiene' },
    category: 'sleep',
    keywords: ['失眠', '睡不着', '睡眠', '熬夜', '早醒', '多梦', '入睡困难'],
    summary: { zh: '大多数学生的失眠与作息紊乱、睡前屏幕使用和焦虑有关，通过行为调整大多可以改善。', en: 'Most student insomnia is linked to irregular schedules, pre-bed screen use and anxiety — and most of it improves with behavioral changes.' },
    sections: [
      {
        heading: { zh: '睡眠卫生的要点', en: 'Sleep hygiene essentials' },
        paragraphs: [
          { zh: '固定起床时间是睡眠卫生的第一原则（比固定入睡时间更重要）；睡前一小时远离手机屏幕，蓝光会抑制褪黑素分泌；午后 2 点后避免咖啡、茶、奶茶等含咖啡因饮品；床只用来睡觉——不在床上刷手机或学习。', en: 'A fixed wake-up time is rule #1 (more important than a fixed bedtime). No screens in the last hour — blue light suppresses melatonin. No caffeine after 2 pm. The bed is for sleep only — no scrolling or studying in bed.' },
          { zh: '躺下 20 分钟仍睡不着时，起身到昏暗环境做安静的事（如听轻音乐），困了再回床。这能打破"床 = 清醒+焦虑"的条件反射。', en: 'If you are still awake after 20 minutes, get up and do something quiet in dim light, then return when sleepy. This breaks the "bed = awake + anxious" reflex.' },
        ],
      },
      {
        heading: { zh: '什么时候需要求助', en: 'When to seek help' },
        paragraphs: [
          { zh: '若失眠每周超过 3 次、持续 1 个月以上，并明显影响白天学习与情绪，建议到校医院或睡眠专科评估。可以在应用内完成 ISI-7 量表，持续跟踪自己的睡眠变化。', en: 'If insomnia occurs more than 3 nights a week for over a month and clearly affects daytime functioning, see the campus clinic or a sleep specialist. Track your sleep with the built-in ISI-7 scale.' },
        ],
      },
    ],
    tips: {
      zh: ['每天同一时间起床，包括周末', '睡前 1 小时放下手机，改看书或听播客', '白天晒 20 分钟太阳、规律运动，帮助夜间入睡', '完成 ISI-7 量表并隔两周复测一次'],
      en: ['Wake up at the same time every day, weekends included', 'Put the phone away 1 hour before bed', 'Get 20 minutes of daylight and regular exercise', 'Take the ISI-7 scale and retest every two weeks'],
    },
  },
  {
    id: 'low-mood',
    title: { zh: '情绪低落与抑郁', en: 'Low Mood & Depression' },
    category: 'emotion',
    hotline: true,
    keywords: ['抑郁', '低落', '开心不起来', '没意思', '提不起劲', '想哭', '丧'],
    summary: { zh: '偶尔情绪低落是正常的；当低落持续两周以上并影响生活，就需要认真对待。抑郁是可以治疗的。', en: 'Occasional low mood is normal; when it lasts over two weeks and affects your life, take it seriously. Depression is treatable.' },
    sections: [
      {
        heading: { zh: '低落与抑郁的区别', en: 'Low mood vs depression' },
        paragraphs: [
          { zh: '情绪低落通常有明确诱因、数天内缓解，且不影响基本生活。抑郁的核心特征是：持续两周以上的情绪低落或兴趣减退，伴随睡眠/食欲改变、注意力下降、自我否定，甚至出现"活着没意思"的想法。', en: 'Low mood usually has a clear trigger and lifts within days. Depression\'s core features are sadness or loss of interest lasting over two weeks, plus changes in sleep/appetite, poor concentration, self-blame, and possibly thoughts that life is meaningless.' },
        ],
      },
      {
        heading: { zh: '可以做些什么', en: 'What you can do' },
        paragraphs: [
          { zh: '行为激活是循证有效的第一步：即使不想动，也坚持每天做一点小事（散步 10 分钟、洗个澡、和一个人说话），行动会先于情绪改变。保持社交接触，独处会让低落加重。', en: 'Behavioral activation is the evidence-based first step: do one small thing daily even without motivation — a 10-minute walk, a shower, talking to one person. Action changes mood before mood enables action. Stay socially connected.' },
          { zh: '避免用酒精、通宵游戏等方式麻痹自己，它们短期内"有效"，长期会让低落加重。如果你的低落持续超过两周，或出现自伤想法，请务必寻求专业帮助——这不是软弱，而是和感冒去看医生一样的正常就医。', en: 'Avoid numbing with alcohol or all-night gaming — they feel helpful short-term but deepen the low. If it lasts over two weeks, or self-harm thoughts appear, please seek professional help — it is as normal as seeing a doctor for a cold.' },
        ],
      },
    ],
    tips: {
      zh: ['每天固定做一件 10 分钟的小事并记在日记里', '用 PHQ-9 量表自查，间隔两周复测对比', '把「我很差」改写为「我最近状态不好，这不是我的全部」', '持续低落时联系学校心理中心或拨打 12356'],
      en: ['Do one 10-minute small thing daily and journal it', 'Self-check with PHQ-9 and retest every two weeks', 'Reframe "I am worthless" as "I am struggling now — this is not all of me"', 'Contact the campus counseling center or call 12356 if it persists'],
    },
  },
  {
    id: 'anxiety',
    title: { zh: '焦虑与担忧', en: 'Anxiety & Worry' },
    category: 'emotion',
    keywords: ['焦虑', '担忧', '紧张', '心慌', '担心', '不安', '烦躁'],
    summary: { zh: '焦虑是大脑的保护机制，但过度且持续的担忧会消耗你。区分"有用的焦虑"和"空转的焦虑"是关键。', en: 'Anxiety is the brain\'s protection system, but excessive, persistent worry drains you. Distinguishing useful from spinning anxiety is the key.' },
    sections: [
      {
        heading: { zh: '焦虑的两面', en: 'Two faces of anxiety' },
        paragraphs: [
          { zh: '有用的焦虑指向具体可解决的问题（"下周三的考试还没复习"），它推动行动，行动后缓解。空转的焦虑指向模糊或不可控的事（"万一将来找不到工作怎么办"），它没有行动出口，越想越糟。', en: 'Useful anxiety points at a concrete solvable problem ("the exam next Wednesday is not revised") — it drives action and fades after action. Spinning anxiety points at vague or uncontrollable things ("what if I never find a job") — it has no action outlet and worsens the more you think.' },
        ],
      },
      {
        heading: { zh: '应对方法', en: 'Coping tools' },
        paragraphs: [
          { zh: '对空转的焦虑：设置"担忧时间"——每天固定 15 分钟专门写下所有担忧，其他时间出现担忧就告诉自己"留到担忧时间"。这能把无边无际的担心装进盒子。', en: 'For spinning anxiety: schedule "worry time" — 15 fixed minutes a day to write down all worries; when worry appears outside it, tell yourself "save it for worry time". This boxes the boundless worry.' },
          { zh: '身体层面：焦虑时呼吸变浅，用 4-7-8 呼吸或共振频率呼吸（应用内治疗练习页）直接安抚神经系统。规律运动被证实与抗焦虑药物效果相当（对轻中度焦虑）。', en: 'At the body level: shallow breathing feeds anxiety — use 4-7-8 or resonance breathing (in the app\'s therapy page) to calm the nervous system directly. Regular exercise shows effects comparable to medication for mild-moderate anxiety.' },
        ],
      },
    ],
    tips: {
      zh: ['区分"能解决"与"不能控制"，只对前者列行动计划', '每天 15 分钟担忧时间，把担忧写下来', '用 GAD-7 量表自查焦虑水平', '心慌时做 4-7-8 呼吸（吸 4 秒-屏 7 秒-呼 8 秒）'],
      en: ['Separate "solvable" from "uncontrollable"; plan only for the former', '15-minute daily worry time — write worries down', 'Self-check anxiety level with GAD-7', 'Try 4-7-8 breathing when your heart races (in 4s - hold 7s - out 8s)'],
    },
  },
  {
    id: 'social-anxiety',
    title: { zh: '社交焦虑', en: 'Social Anxiety' },
    category: 'emotion',
    keywords: ['社恐', '社交', '上台', '发言', '尴尬', '不敢说话', '人多'],
    summary: { zh: '害怕被评价、担心出丑是人之常情；当它让你回避所有社交时，才需要专门处理。', en: 'Fearing judgment and embarrassment is human; it needs dedicated attention only when it makes you avoid all social situations.' },
    sections: [
      {
        heading: { zh: '理解社交焦虑', en: 'Understanding social anxiety' },
        paragraphs: [
          { zh: '社交焦虑的核心信念是"别人都在盯着我的缺点"。但心理学中的"聚光灯效应"实验表明：人们记住你的尴尬远比你自己少得多——你以为的社死现场，别人往往根本没过脑。', en: 'The core belief of social anxiety is "everyone is watching my flaws". But the spotlight-effect experiments show people remember your embarrassment far less than you think — your "social death" moments barely register with others.' },
        ],
      },
      {
        heading: { zh: '循序渐进的暴露', en: 'Gradual exposure' },
        paragraphs: [
          { zh: '治疗社交焦虑最有效的方法是渐进暴露：从最不吓人的情境开始（给同学发一条消息）逐步升级（课间和同桌聊天→小组发言→课堂提问），每一步都带着焦虑去做，直到大脑学会"这没那么可怕"。回避只会让焦虑越来越强。', en: 'The most effective treatment is gradual exposure: start with the least scary situation (sending one message) and level up step by step (chatting at break → speaking in a group → asking in class), acting with the anxiety until the brain learns "this is not that dangerous". Avoidance only strengthens it.' },
        ],
      },
    ],
    tips: {
      zh: ['列一张从易到难的社交清单，每周完成一档', '发言前把注意力放在"我要讲的内容"而非"我的表现"', '事后复盘时只记事实，不记"别人肯定觉得我蠢"的猜测'],
      en: ['Make an easy-to-hard social list and complete one level weekly', 'Before speaking, focus on your content, not your performance', 'Afterwards, record facts only — not guesses about what others thought'],
    },
  },
  {
    id: 'procrastination',
    title: { zh: '拖延症', en: 'Procrastination' },
    category: 'study',
    keywords: ['拖延', '不想开始', 'deadline', 'ddl', '赶作业', '懒'],
    summary: { zh: '拖延不是懒，而是情绪调节问题：我们用回避来逃避任务带来的负面情绪，代价是更深的焦虑。', en: 'Procrastination is not laziness but emotion regulation: we avoid tasks to escape the negative feelings they trigger, at the cost of deeper anxiety.' },
    sections: [
      {
        heading: { zh: '为什么总是拖延', en: 'Why we procrastinate' },
        paragraphs: [
          { zh: '拖延的本质是"先处理心情，再处理事情"：任务太大→压力→回避→刷手机缓解→愧疚→压力更大。破解的关键不是更自律，而是降低启动门槛。', en: 'Procrastination is "mood repair before task": huge task → stress → avoidance → scrolling to feel better → guilt → more stress. The fix is not more discipline but lowering the starting threshold.' },
        ],
      },
      {
        heading: { zh: '降低启动门槛的方法', en: 'Lowering the starting threshold' },
        paragraphs: [
          { zh: '把"写论文"改成"打开文档写三行字"；用 2 分钟规则：任何任务先只做 2 分钟，2 分钟后可以停下——多数人一旦开始就停不下来。把手机放在另一个房间，物理隔离诱惑。', en: 'Turn "write the paper" into "open the document and write three lines". Use the 2-minute rule: commit to just 2 minutes, then you may stop — most people keep going once started. Put the phone in another room; physically separate temptation.' },
          { zh: '在应用里为任务设置截止时间与提醒、拆分子任务，让系统替你记住压力，而不是靠大脑硬扛。', en: 'Set due times, reminders and subtasks for tasks in the app — let the system hold the pressure instead of your brain.' },
        ],
      },
    ],
    tips: {
      zh: ['任务拆到 2 分钟内能启动的粒度', '把最难的 1 件事安排在精力最好的上午', '完成任务后给自己一个即时小奖励'],
      en: ['Break tasks small enough to start within 2 minutes', 'Schedule the hardest item in your peak-energy morning', 'Give yourself an immediate small reward after finishing'],
    },
  },
  {
    id: 'perfectionism',
    title: { zh: '完美主义', en: 'Perfectionism' },
    category: 'self',
    keywords: ['完美', '完美主义', '怕犯错', '不满意', '高标准', '自我批评'],
    summary: { zh: '追求卓越让人进步，追求完美让人瘫痪。学会"足够好"标准，是成年人的重要心理功课。', en: 'Pursuing excellence moves you forward; pursuing perfection paralyzes you. Learning "good enough" is a key psychological lesson.' },
    sections: [
      {
        heading: { zh: '完美主义的代价', en: 'The cost of perfectionism' },
        paragraphs: [
          { zh: '完美主义把"犯错"等同于"我不行"，于是要么迟迟不敢开始，要么完成后仍无法满足。研究发现它与拖延、焦虑、抑郁显著相关。', en: 'Perfectionism equates "making a mistake" with "I am a failure", so you either never start or never feel satisfied after finishing. Research links it strongly to procrastination, anxiety and depression.' },
        ],
      },
      {
        heading: { zh: '转向"足够好"', en: 'Moving to "good enough"' },
        paragraphs: [
          { zh: '给每件事设定 80 分标准：80 分的作业按时交，远好于 100 分但永远写不完的作业。用"完成优于完美"作为行动口号，允许自己先交一个能用的版本再迭代。', en: 'Set an 80-point standard for each task: an 80-point assignment submitted on time beats a 100-point one that is never finished. Adopt "done beats perfect" as a motto and ship a usable version first, then iterate.' },
          { zh: '练习自我同情：当你犯错时，用对好朋友说话的语气对自己说。自我批评并不会让你更优秀，只会让你更疲惫。', en: 'Practice self-compassion: when you err, talk to yourself the way you would to a good friend. Self-criticism does not make you better — only more exhausted.' },
        ],
      },
    ],
    tips: {
      zh: ['给任务明确写下一个"足够好"标准再开始', '把"我必须"改成"我选择/我希望"', '每周故意做一件不完美的小事并观察后果'],
      en: ['Write down an explicit "good enough" criterion before starting', 'Replace "I must" with "I choose / I hope"', 'Deliberately do one imperfect small thing weekly and observe the outcome'],
    },
  },
  {
    id: 'stress',
    title: { zh: '压力管理', en: 'Stress Management' },
    category: 'daily',
    keywords: ['压力', '累', '忙', '喘不过气', '崩溃', '内卷', '事多'],
    summary: { zh: '压力不是敌人，长期得不到恢复的压力才是。管理压力的核心是"张弛有度"。', en: 'Stress is not the enemy — stress without recovery is. The core of stress management is rhythm between tension and rest.' },
    sections: [
      {
        heading: { zh: '压力如何影响你', en: 'How stress affects you' },
        paragraphs: [
          { zh: '短期压力提升专注与效率；但长期高压会让身体持续处于"战斗模式"，表现为易怒、失眠、注意力下降、免疫力变差，甚至诱发或加重焦虑抑郁。', en: 'Short-term stress boosts focus and efficiency; but chronic high pressure keeps the body in "fight mode" — irritability, insomnia, poor focus, weakened immunity, and even triggering or worsening anxiety and depression.' },
        ],
      },
      {
        heading: { zh: '建立恢复节奏', en: 'Building a recovery rhythm' },
        paragraphs: [
          { zh: '恢复不是等忙完再说，而是每天主动安排：每学习 90 分钟休息 10-15 分钟；每周至少半天完全不碰学习；保证运动——运动是已被充分验证的"压力缓冲器"。', en: 'Recovery is scheduled, not postponed: rest 10-15 minutes every 90 minutes of study; keep half a day weekly completely study-free; exercise — the best-validated stress buffer.' },
          { zh: '压力大时优先保证睡眠与饮食，再谈效率。可以记录自己的"压力信号"（如开始咬指甲、对小事发火），把它们作为提醒自己减速的闹钟。', en: 'Under heavy pressure, protect sleep and meals before chasing efficiency. Record your personal stress signals (nail-biting, snapping at small things) and use them as alarms to slow down.' },
        ],
      },
    ],
    tips: {
      zh: ['每 90 分钟学习后强制休息 10 分钟，离开座位', '每周留半天"无学习日"', '用 PSS-10 量表定期自查压力水平', '压力大时先睡觉，再解决问题'],
      en: ['Force a 10-minute break away from your desk every 90 minutes', 'Keep half a day study-free each week', 'Check your stress level regularly with PSS-10', 'When overwhelmed, sleep first, then solve'],
    },
  },
  {
    id: 'self-compassion',
    title: { zh: '自我关怀', en: 'Self-Compassion' },
    category: 'self',
    keywords: ['自我关怀', '爱自己', '自我接纳', '自责', '原谅自己', '心疼自己'],
    summary: { zh: '自我关怀不是放纵，而是用对待好朋友的方式对待自己——研究证实它比自我批评更能带来进步。', en: 'Self-compassion is not indulgence but treating yourself like a good friend — research shows it drives growth better than self-criticism.' },
    sections: [
      {
        heading: { zh: '自我关怀的三个成分', en: 'Three components of self-compassion' },
        paragraphs: [
          { zh: '心理学家 Kristin Neff 提出自我关怀 = 善待自己（而非自我批判）+ 共同人性（痛苦人人都有，而非"只有我这么糟"）+ 正念觉察（承认痛苦而不夸大）。', en: 'Psychologist Kristin Neff defines self-compassion as self-kindness (not self-criticism) + common humanity (everyone struggles; it is not "only me") + mindfulness (acknowledging pain without exaggerating it).' },
        ],
      },
      {
        heading: { zh: '日常练习', en: 'Daily practice' },
        paragraphs: [
          { zh: '当你又开始自我批评时，停下来问："如果是我最好的朋友遇到这件事，我会对 ta 说什么？"然后把同样的话对自己说一遍。写"自我关怀日记"：每天记一件善待自己的小事。', en: 'When self-criticism starts, pause and ask: "What would I say to my best friend in this situation?" Then say it to yourself. Keep a self-compassion journal: one small kind act toward yourself daily.' },
        ],
      },
    ],
    tips: {
      zh: ['自我批评出现时，用朋友语气改写那段话', '每天睡前写下 3 件自己做得不错的小事', '允许自己休息，休息不是浪费时间'],
      en: ['Rewrite the inner criticism in a friend\'s tone', 'Write 3 small things you did well before bed', 'Give yourself permission to rest — resting is not wasted time'],
    },
  },
  {
    id: 'relationship-conflict',
    title: { zh: '人际冲突与失恋', en: 'Conflict & Breakups' },
    category: 'relationship',
    keywords: ['吵架', '室友', '朋友', '失恋', '分手', '被孤立', '矛盾', '冷战'],
    summary: { zh: '关系中的痛苦是真实的痛苦。冲突可以修复，失去需要哀悼，两者都需要时间与自我照顾。', en: 'Relationship pain is real pain. Conflicts can be repaired, losses need grieving — both take time and self-care.' },
    sections: [
      {
        heading: { zh: '处理冲突', en: 'Handling conflict' },
        paragraphs: [
          { zh: '有效沟通用"我句式"表达感受与需求："当你……（行为）时，我感到……（感受），我希望……（具体请求）"，避免"你总是/你从不"式的指责。冲突的目标不是赢，而是关系修复。', en: 'Use "I statements" to express feelings and needs: "When you (behavior), I feel (feeling), and I would like (specific request)." Avoid "you always/never" accusations. The goal of conflict is repair, not victory.' },
        ],
      },
      {
        heading: { zh: '面对失去', en: 'Facing loss' },
        paragraphs: [
          { zh: '分手后的痛苦与戒断反应类似：情绪会反复，这是正常的哀悼过程，不是"我走不出来"。允许自己难过，同时保持基本生活节奏（吃饭、睡觉、上课），用写日记安放那些说不出口的话。', en: 'Post-breakup pain resembles withdrawal: emotions come in waves — a normal grieving process, not "I can\'t move on". Allow sadness while keeping basic routines (meals, sleep, classes), and put unsaid words into your journal.' },
        ],
      },
    ],
    tips: {
      zh: ['冲突后 24 小时内发起一次"我句式"沟通', '把想对对方说的话写进日记，而不是深夜发出去', '恢复期的目标只是"今天正常吃饭睡觉上课"'],
      en: ['Open one "I statement" conversation within 24 hours of a conflict', 'Journal the words you want to say instead of sending them at midnight', 'During recovery, the goal is simply "eat, sleep and attend class today"'],
    },
  },
  {
    id: 'bullying',
    title: { zh: '校园欺凌', en: 'Bullying' },
    category: 'relationship',
    hotline: true,
    keywords: ['欺凌', '霸凌', '欺负', '孤立', '排挤', '威胁', '被骂'],
    summary: { zh: '被欺凌不是你的错。沉默只会让欺凌持续，说出来是阻止它的第一步。', en: 'Being bullied is never your fault. Silence lets it continue; speaking up is the first step to stopping it.' },
    sections: [
      {
        heading: { zh: '识别欺凌', en: 'Recognizing bullying' },
        paragraphs: [
          { zh: '欺凌包括肢体、言语、关系（孤立排挤）与网络欺凌。它的特征是重复发生且双方力量不对等。一次性的冲突不是欺凌，但重复的嘲笑、威胁、孤立就是。', en: 'Bullying includes physical, verbal, relational (isolation) and online forms. Its hallmarks are repetition and a power imbalance. A one-off conflict is not bullying — repeated mockery, threats or exclusion is.' },
        ],
      },
      {
        heading: { zh: '你可以做什么', en: 'What you can do' },
        paragraphs: [
          { zh: '第一，保留证据（聊天记录、截图）；第二，告诉可信任的人——辅导员、班主任、心理中心或父母，这不是"打小报告"，而是正当求助；第三，避免独自面对施暴者。学校有义务处理欺凌事件。', en: 'First, keep evidence (chat logs, screenshots). Second, tell someone you trust — a counselor, advisor, the counseling center or your parents; this is not "snitching" but legitimate help-seeking. Third, avoid facing the bully alone. Schools are obligated to handle bullying.' },
          { zh: '如果欺凌让你出现持续的情绪低落、失眠或自伤想法，请立即联系心理中心或拨打心理援助热线。', en: 'If bullying causes lasting low mood, insomnia or self-harm thoughts, contact the counseling center or a support hotline immediately.' },
        ],
      },
    ],
    tips: {
      zh: ['保存所有欺凌证据并备份', '48 小时内告诉一位可信任的成年人', '与支持你的同学结伴行动', '欺凌导致持续痛苦时拨打 12356'],
      en: ['Save and back up all evidence', 'Tell a trusted adult within 48 hours', 'Move with classmates who support you', 'Call 12356 if the pain persists'],
    },
  },
  {
    id: 'seeking-help',
    title: { zh: '何时寻求专业帮助', en: 'When to Seek Professional Help' },
    category: 'crisis',
    hotline: true,
    keywords: ['心理咨询', '看医生', '求助', '心理老师', '心理中心', '要不要'],
    summary: { zh: '求助不是软弱，而是对自己的负责。出现这些信号时，请认真考虑联系专业帮助。', en: 'Seeking help is not weakness but responsibility toward yourself. Consider professional help when these signs appear.' },
    sections: [
      {
        heading: { zh: '值得求助的信号', en: 'Signs worth acting on' },
        paragraphs: [
          { zh: '①情绪低落、焦虑或易怒持续两周以上且影响学习生活；②睡眠或食欲明显改变；③反复出现自伤或"不想活了"的念头；④对以前喜欢的事完全提不起兴趣；⑤无法正常完成学业或基本生活。', en: '① Low mood, anxiety or irritability lasting 2+ weeks and affecting daily life; ② marked sleep or appetite changes; ③ recurring self-harm or "don\'t want to live" thoughts; ④ total loss of interest in things you used to enjoy; ⑤ inability to keep up with studies or basic life.' },
        ],
      },
      {
        heading: { zh: '去哪求助', en: 'Where to go' },
        paragraphs: [
          { zh: '校内的学校心理中心（免费、保密、了解学生处境）是第一选择；也可以到三甲医院心理科/精神科评估。学校辅导员是连接资源的桥梁。心理援助热线随时可拨：12356（全国统一）、400-161-9995。', en: 'Your campus counseling center (free, confidential, understands student life) is the first choice; hospital psychiatry/psychology departments can assess too. Advisors can bridge you to resources. Hotlines are always available: 12356 (national) and 400-161-9995.' },
        ],
      },
    ],
    tips: {
      zh: ['把"求助"写进你的安全计划第五步', '第一次咨询前把想说的写下来，减少开口压力', '咨询不匹配时换一位咨询师，这很正常'],
      en: ['Write "seeking help" into step 5 of your safety plan', 'Jot down what to say before the first session', 'Switching counselors when it does not fit is normal'],
    },
  },
  {
    id: 'crisis',
    title: { zh: '危机时刻该做什么', en: 'What to Do in a Crisis' },
    category: 'crisis',
    hotline: true,
    keywords: ['自杀', '不想活', '结束一切', '撑不下去', '危机', '伤害自己'],
    summary: { zh: '如果你正处在危机中：你此刻的感受是真实的，但它是会过去的。请立即做这几件事。', en: 'If you are in crisis right now: what you feel is real, and it will pass. Please do these things immediately.' },
    sections: [
      {
        heading: { zh: '立刻做这五件事', en: 'Do these five things now' },
        paragraphs: [
          { zh: '①远离危险物品与环境，让自己先安全；②拨打心理援助热线 12356 或 400-161-9995（24 小时），或联系 120/110；③告诉身边一个可信任的人你现在的状态，不要独自承受；④如果已制定安全计划，打开它并跟随第一步行动；⑤记住：危机是暂时的状态，不是永久的处境。', en: '① Move away from dangerous objects and places — make yourself safe first; ② call 12356 or 400-161-9995 (24h), or 120/110; ③ tell one trusted person nearby how you feel — do not face it alone; ④ if you have made a safety plan, open it and follow step one; ⑤ remember: a crisis is a temporary state, not a permanent condition.' },
        ],
      },
      {
        heading: { zh: '给关心你的人', en: 'For those who care' },
        paragraphs: [
          { zh: '如果你发现身边的人有危机信号：直接而平静地询问"你最近是否有不想活的想法？"——询问不会"提醒"对方自杀，反而让对方感到被看见。倾听不评判，陪伴不离开，并帮助 ta 联系专业资源。', en: 'If someone around you shows crisis signs: ask directly and calmly, "Have you had thoughts of not wanting to live lately?" — asking never "plants" the idea; it makes the person feel seen. Listen without judgment, stay present, and help them reach professional resources.' },
        ],
      },
    ],
    tips: {
      zh: ['把 12356 存进手机通讯录', '现在就制定你的安全计划', '危机过后请继续寻求专业支持，危机容易反复'],
      en: ['Save 12356 in your phone contacts', 'Create your safety plan now', 'Continue professional support after a crisis — crises can recur'],
    },
  },
  {
    id: 'resilience',
    title: { zh: '心理韧性', en: 'Psychological Resilience' },
    category: 'self',
    keywords: ['韧性', '复原力', '抗压', '坚强', '恢复', '挫折'],
    summary: { zh: '韧性不是天生不变的品质，而是一组可以练习的能力：连接、目标、灵活、自我照顾。', en: 'Resilience is not a fixed trait but a set of trainable skills: connection, purpose, flexibility and self-care.' },
    sections: [
      {
        heading: { zh: '韧性的可塑性', en: 'Resilience is trainable' },
        paragraphs: [
          { zh: '研究显示，韧性主要来自保护性因素：稳定的支持关系、有意义的日常目标、对挫折的灵活解释（"这次失败是暂时的、局部的、可改变的"），以及规律的运动与睡眠。这些都可以主动建设。', en: 'Research shows resilience comes mainly from protective factors: stable supportive relationships, meaningful daily goals, flexible explanations of setbacks ("this failure is temporary, local and changeable"), and regular exercise and sleep. All can be actively built.' },
        ],
      },
      {
        heading: { zh: '建设你的韧性系统', en: 'Building your resilience system' },
        paragraphs: [
          { zh: '维护 2-3 段高质量关系；为每天设定一个"今天想完成的小目标"；遇到挫折时练习"3P 反驳"——它不是永久的（permanent）、不是全盘的（pervasive）、不是我的全部过错（personal）。用 CD-RISC-10 量表追踪自己的变化。', en: 'Maintain 2-3 quality relationships; set one small daily goal; practice the "3P rebuttal" after setbacks — it is not Permanent, not Pervasive, not entirely Personal. Track your change with the CD-RISC-10 scale.' },
        ],
      },
    ],
    tips: {
      zh: ['每周主动联系一位重要的人', '用 CD-RISC-10 建立自己的韧性基线', '挫折后写下"3P 反驳"三段话'],
      en: ['Proactively contact one important person weekly', 'Set a resilience baseline with CD-RISC-10', 'Write a "3P rebuttal" after each setback'],
    },
  },
];

const CATEGORY_LABELS: Record<KnowledgeTopic['category'], string> = {
  study: '学习与考试',
  emotion: '情绪',
  sleep: '睡眠',
  relationship: '人际关系',
  self: '自我成长',
  crisis: '求助与危机',
  daily: '日常生活',
};

export function getCategoryLabel(category: KnowledgeTopic['category']): string {
  return CATEGORY_LABELS[category];
}

export function getAllTopics(): KnowledgeTopic[] {
  return KNOWLEDGE_TOPICS;
}

/**
 * 加权关键词检索：标题命中 > 关键词命中 > 摘要命中。
 * 返回按得分降序的话题列表（得分 > 0）。
 */
export function searchKnowledge(query: string, limit = 3): KnowledgeTopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = KNOWLEDGE_TOPICS.map((topic) => {
    let score = 0;
    if (topic.title.zh.toLowerCase().includes(q) || topic.title.en.toLowerCase().includes(q)) score += 10;
    for (const kw of topic.keywords) {
      if (kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase())) score += 6;
    }
    if (topic.summary.zh.toLowerCase().includes(q) || topic.summary.en.toLowerCase().includes(q)) score += 2;
    for (const section of topic.sections) {
      for (const p of section.paragraphs) {
        if (p.zh.toLowerCase().includes(q) || p.en.toLowerCase().includes(q)) score += 1;
      }
    }
    return { topic, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.topic);
}
