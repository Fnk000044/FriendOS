import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { BookOpen, Search, PhoneCall, ShieldCheck, ChevronDown, Lightbulb } from 'lucide-react';
import Card from '../components/common/Card';
import { useLanguage } from '../i18n/useLanguage';
import {
  getAllTopics, getCategoryLabel, searchKnowledge,
  type KnowledgeTopic,
} from '../services/knowledge/psychKnowledge';

/**
 * KnowledgePage — 离线心理科普库（庆园杯 P1-5）
 * 搜索/分类浏览 + 展开式详情。支持 ?topic=<id> 直达某一话题。
 * 内容全部内置离线，危机类话题恒显热线提示。
 */

const CATEGORIES: KnowledgeTopic['category'][] = ['study', 'emotion', 'sleep', 'relationship', 'self', 'daily', 'crisis'];

export default function KnowledgePage() {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<KnowledgeTopic['category'] | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(initialTopic);

  const all = useMemo(() => getAllTopics(), []);

  const filtered = useMemo(() => {
    let list = all;
    if (category !== 'all') list = list.filter((x) => x.category === category);
    if (query.trim()) {
      const matches = searchKnowledge(query, 100);
      const ids = new Set(matches.map((m) => m.id));
      list = list.filter((x) => ids.has(x.id));
    }
    return list;
  }, [all, category, query]);

  const zh = lang === 'zh-CN';
  const pick = (v: { zh: string; en: string }) => (zh ? v.zh : v.en);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
          <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-primary">{t('nav.knowledge')}</h2>
          <p className="text-xs text-text-muted">{t('knowledge.desc')}</p>
        </div>
      </div>

      {/* 搜索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('knowledge.search_placeholder')}
          aria-label={t('knowledge.search_placeholder')}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ borderColor: 'var(--glass-border)' }}
        />
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors border ${category === 'all' ? 'text-white' : 'text-text-secondary hover:bg-surface-hover'}`}
          style={category === 'all' ? { background: 'var(--gradient-primary)', borderColor: 'transparent' } : { borderColor: 'var(--glass-border)' }}
        >
          {t('knowledge.all_categories')}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors border ${category === c ? 'text-white' : 'text-text-secondary hover:bg-surface-hover'}`}
            style={category === c ? { background: 'var(--gradient-primary)', borderColor: 'transparent' } : { borderColor: 'var(--glass-border)' }}
          >
            {getCategoryLabel(c)}
          </button>
        ))}
      </div>

      {/* 话题列表 */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted text-center py-6">{t('knowledge.no_results')}</p>
        </Card>
      ) : (
        filtered.map((topic) => {
          const open = openId === topic.id;
          return (
            <Card key={topic.id} className={open ? 'ring-1 ring-primary/20' : ''}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : topic.id)}
                className="w-full flex items-center gap-3 text-left cursor-pointer"
                aria-expanded={open}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-text-primary">{pick(topic.title)}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                      {getCategoryLabel(topic.category)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{pick(topic.summary)}</p>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {open && (
                <div className="mt-4 pt-4 border-t space-y-4 fade-in-up" style={{ borderColor: 'var(--glass-border)' }}>
                  {topic.sections.map((section) => (
                    <div key={section.heading.zh}>
                      <h4 className="text-sm font-medium text-text-primary mb-1.5">{pick(section.heading)}</h4>
                      {section.paragraphs.map((p) => (
                        <p key={p.zh.slice(0, 16)} className="text-sm text-text-secondary leading-relaxed mb-1.5">{pick(p)}</p>
                      ))}
                    </div>
                  ))}

                  <div className="rounded-xl p-3.5" style={{ background: 'var(--bg-hover)' }}>
                    <p className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                      {t('knowledge.tips')}
                    </p>
                    <ul className="space-y-1.5">
                      {topic.tips[zh ? 'zh' : 'en'].map((tip) => (
                        <li key={tip} className="text-xs text-text-secondary flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {topic.hotline && (
                    <div className="rounded-xl p-3.5 border border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-900/20">
                      <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {t('knowledge.hotline_note')}
                      </p>
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">12356 · 400-161-9995（24 小时）</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}

      <div className="flex items-start gap-2 text-xs text-text-muted">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
        <p>{t('knowledge.disclaimer')}</p>
      </div>

      <Link
        to="/safety-plan"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
        {t('knowledge.open_safety_plan')} ↗
      </Link>
    </div>
  );
}
